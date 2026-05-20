import type { GameMatchCounts, InviteLiveMatch, InviteLivePlayer, MatchSummary } from "@/lib/api"
import type { GameCableEvent } from "@/lib/game-cable"
import { adjustSessionStatsForFinishedMatch } from "@/lib/match-stats"

export interface InviteLiveState {
  players: InviteLivePlayer[]
  matches: InviteLiveMatch[]
  matchCounts: GameMatchCounts
}

export type InviteLiveApplyOptions = {
  /** Live invite link: only keep ongoing + pending in the list; track finished via counts */
  liveSnapshot?: boolean
}

export function matchSummaryToInviteLive(m: MatchSummary): InviteLiveMatch {
  return {
    id: m.id,
    match_number: m.match_number,
    status: m.status,
    priority: m.priority,
    court_number: m.court_number,
    winner_team: m.winner_team,
    team_a_score: m.team_a_score,
    team_b_score: m.team_b_score,
    team_a: m.team_a.map((p) => ({ id: p.id, name: p.name, avatar_url: p.avatar_url })),
    team_b: m.team_b.map((p) => ({ id: p.id, name: p.name, avatar_url: p.avatar_url })),
  }
}

function sortLiveMatches(matches: InviteLiveMatch[]): InviteLiveMatch[] {
  return [...matches].sort((a, b) => {
    const order = (s: InviteLiveMatch["status"]) =>
      s === "ongoing" ? 0 : s === "pending" ? 1 : 2
    const d = order(a.status) - order(b.status)
    if (d !== 0) return d
    if (a.status === "pending" && b.status === "pending") {
      if (a.priority !== b.priority) return a.priority ? -1 : 1
    }
    return a.match_number - b.match_number
  })
}

function recount(state: InviteLiveState): InviteLiveState {
  const pending = state.matches.filter((m) => m.status === "pending").length
  const ongoing = state.matches.filter((m) => m.status === "ongoing").length
  return {
    ...state,
    matchCounts: {
      ...state.matchCounts,
      pending,
      ongoing,
    },
  }
}

function patchInviteMatch(
  state: InviteLiveState,
  updated: InviteLiveMatch,
  options?: InviteLiveApplyOptions,
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

  let finishedCount = state.matchCounts.finished

  if (options?.liveSnapshot && updated.status === "finished") {
    const matches = state.matches.filter((m) => m.id !== updated.id)
    if (prevMatch?.status !== "finished") finishedCount += 1
    return recount({
      players,
      matches: sortLiveMatches(matches),
      matchCounts: { ...state.matchCounts, finished: finishedCount },
    })
  }

  const matches = state.matches.map((m) => {
    if (m.id === updated.id) return updated
    if (updated.priority && updated.status === "pending") return { ...m, priority: false }
    return m
  })
  const hasMatch = matches.some((m) => m.id === updated.id)
  let nextMatches =
    hasMatch || updated.status !== "pending" ? matches : [...matches, updated]

  if (options?.liveSnapshot) {
    nextMatches = nextMatches.filter((m) => m.status === "ongoing" || m.status === "pending")
    nextMatches = sortLiveMatches(nextMatches)
  }

  return recount({
    players,
    matches: nextMatches,
    matchCounts: { ...state.matchCounts, finished: finishedCount },
  })
}

export function normalizeInviteLiveState(
  state: InviteLiveState,
  liveSnapshot: boolean,
): InviteLiveState {
  if (!liveSnapshot) return state
  const matches = sortLiveMatches(
    state.matches.filter((m) => m.status === "ongoing" || m.status === "pending"),
  )
  return recount({ ...state, matches })
}

export function applyInviteCableEvent(
  state: InviteLiveState,
  payload: GameCableEvent,
  options?: InviteLiveApplyOptions,
): InviteLiveState {
  if (payload.event === "match.deleted") {
    const removed = state.matches.find((m) => m.id === payload.match_id)
    let finishedCount = state.matchCounts.finished
    if (options?.liveSnapshot && removed?.status === "finished") {
      finishedCount = Math.max(0, finishedCount - 1)
    }
    const matches = state.matches.filter((m) => m.id !== payload.match_id)
    return recount({
      ...state,
      matches: options?.liveSnapshot ? sortLiveMatches(matches) : matches,
      matchCounts: { ...state.matchCounts, finished: finishedCount },
    })
  }

  if ("match" in payload && payload.match) {
    return patchInviteMatch(state, matchSummaryToInviteLive(payload.match), options)
  }

  return state
}
