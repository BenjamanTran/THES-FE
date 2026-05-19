import type { GameMatchCounts, InviteLiveMatch, InviteLivePlayer, MatchSummary } from "@/lib/api"
import type { GameCableEvent } from "@/lib/game-cable"
import { adjustSessionStatsForFinishedMatch, matchCountsFromList } from "@/lib/match-stats"

export interface InviteLiveState {
  players: InviteLivePlayer[]
  matches: InviteLiveMatch[]
  matchCounts: GameMatchCounts
}

export function matchSummaryToInviteLive(m: MatchSummary): InviteLiveMatch {
  return {
    id: m.id,
    match_number: m.match_number,
    status: m.status,
    priority: m.priority,
    winner_team: m.winner_team,
    team_a_score: m.team_a_score,
    team_b_score: m.team_b_score,
    team_a: m.team_a.map((p) => ({ id: p.id, name: p.name })),
    team_b: m.team_b.map((p) => ({ id: p.id, name: p.name })),
  }
}

function patchInviteMatch(
  state: InviteLiveState,
  updated: InviteLiveMatch,
): InviteLiveState {
  const prevMatch = state.matches.find((m) => m.id === updated.id)
  let players = state.players

  if (
    prevMatch?.status === "finished" &&
    updated.status !== "finished" &&
    prevMatch.winner_team
  ) {
    players = adjustSessionStatsForFinishedMatch(players, prevMatch as MatchSummary, -1)
  } else if (
    updated.status === "finished" &&
    prevMatch?.status !== "finished" &&
    updated.winner_team
  ) {
    players = adjustSessionStatsForFinishedMatch(players, updated as MatchSummary, 1)
  } else if (
    prevMatch?.status === "finished" &&
    updated.status === "finished" &&
    prevMatch.winner_team &&
    updated.winner_team &&
    prevMatch.winner_team !== updated.winner_team
  ) {
    players = adjustSessionStatsForFinishedMatch(players, prevMatch as MatchSummary, -1)
    players = adjustSessionStatsForFinishedMatch(players, updated as MatchSummary, 1)
  }

  const matches = state.matches.map((m) => {
    if (m.id === updated.id) return updated
    if (updated.priority && updated.status === "pending") return { ...m, priority: false }
    return m
  })
  const hasMatch = matches.some((m) => m.id === updated.id)
  const nextMatches =
    hasMatch || updated.status !== "pending" ? matches : [...matches, updated]

  return {
    players,
    matches: nextMatches,
    matchCounts: matchCountsFromList(nextMatches as MatchSummary[], {
      fallbackFinished: state.matchCounts.finished,
    }),
  }
}

export function applyInviteCableEvent(
  state: InviteLiveState,
  payload: GameCableEvent,
): InviteLiveState {
  if (payload.event === "match.deleted") {
    const matches = state.matches.filter((m) => m.id !== payload.match_id)
    return {
      players: state.players,
      matches,
      matchCounts: matchCountsFromList(matches as MatchSummary[], {
        fallbackFinished: state.matchCounts.finished,
      }),
    }
  }

  if ("match" in payload && payload.match) {
    return patchInviteMatch(state, matchSummaryToInviteLive(payload.match))
  }

  return state
}
