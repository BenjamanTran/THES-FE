import type { GameMatchCounts, GamePlayer, MatchSummary } from "@/lib/api"

export interface PlayerSessionStats {
  played: number
  wins: number
  losses: number
}

/** Finished matches only — displayed as "X trận" / W-L on game detail. */
export function computePlayerMatchCounts(matches: MatchSummary[] | undefined) {
  const counts: Record<number, PlayerSessionStats> = {}
  if (!matches) return counts

  for (const match of matches) {
    if (match.status !== "finished") continue

    const allPlayers = [...(match.team_a || []), ...(match.team_b || [])]
    for (const p of allPlayers) {
      if (!counts[p.id]) counts[p.id] = { played: 0, wins: 0, losses: 0 }
      counts[p.id].played += 1
      if (match.winner_team) {
        const inTeamA = match.team_a.some((t) => t.id === p.id)
        const inTeamB = match.team_b.some((t) => t.id === p.id)
        const won =
          (match.winner_team === "team_a" && inTeamA) || (match.winner_team === "team_b" && inTeamB)
        if (won) counts[p.id].wins += 1
        else counts[p.id].losses += 1
      }
    }
  }
  return counts
}

/** Finished + ongoing — who should play next (ignore pending queue slots). */
export function computeRotationCounts(matches: MatchSummary[] | undefined) {
  const counts: Record<number, number> = {}
  if (!matches) return counts

  for (const match of matches) {
    if (match.status === "pending") continue
    const allPlayers = [...(match.team_a || []), ...(match.team_b || [])]
    for (const p of allPlayers) {
      counts[p.id] = (counts[p.id] ?? 0) + 1
    }
  }
  return counts
}

/** Every match in the session (pending + ongoing + finished) — avoid over-scheduling in batch. */
export function computeScheduledCounts(matches: MatchSummary[] | undefined) {
  const counts: Record<number, number> = {}
  if (!matches) return counts

  for (const match of matches) {
    const allPlayers = [...(match.team_a || []), ...(match.team_b || [])]
    for (const p of allPlayers) {
      counts[p.id] = (counts[p.id] ?? 0) + 1
    }
  }
  return counts
}

/** @deprecated Use computeRotationCounts or computeScheduledCounts explicitly. */
export function computeParticipationCounts(matches: MatchSummary[] | undefined) {
  return computeScheduledCounts(matches)
}

/** Tab badges — derive from loaded matches; finished uses API fallback until Xong tab loads. */
export function matchCountsFromList(
  matches: MatchSummary[] | undefined,
  options?: { fallbackFinished?: number; finishedLoaded?: boolean },
): GameMatchCounts {
  const all = matches ?? []
  const finishedInMem = all.filter((m) => m.status === "finished").length
  const fallback = options?.fallbackFinished ?? 0
  return {
    pending: all.filter((m) => m.status === "pending").length,
    ongoing: all.filter((m) => m.status === "ongoing").length,
    finished: options?.finishedLoaded ? finishedInMem : Math.max(fallback, finishedInMem),
  }
}

export function minSessionPlayed(counts: Record<number, PlayerSessionStats>) {
  const values = Object.values(counts).map((c) => c.played)
  if (values.length === 0) return 0
  return Math.min(...values)
}

export function maxSessionPlayed(counts: Record<number, PlayerSessionStats>) {
  const values = Object.values(counts).map((c) => c.played)
  if (values.length === 0) return 0
  return Math.max(...values)
}

/**
 * Fairness weight for suggest / batch / balance: finished (incl. ongoing) × 1000 + slots in any match.
 * Lower = should play next. Pending queue counts toward load so we do not over-schedule the same four.
 */
/** Finished + ongoing only — who should step on court next (ignore pending queue slots). */
export function rotationFairnessCounts(
  players: GamePlayer[],
  matches: MatchSummary[] | undefined,
): Record<number, number> {
  const rotation = computeRotationCounts(matches)
  const counts: Record<number, number> = {}
  for (const p of players) {
    counts[p.id] = Math.max(rotation[p.id] ?? 0, p.session_matches?.played ?? 0)
  }
  return counts
}

/** Max − min played in session (same basis as player list "X trận", no pending queue). */
export function sessionPlayedSpread(
  players: GamePlayer[],
  matches: MatchSummary[] | undefined,
): number {
  const counts = rotationFairnessCounts(players, matches)
  const values = players.map((p) => counts[p.id] ?? 0)
  if (values.length === 0) return 0
  return Math.max(...values) - Math.min(...values)
}

/** Slots in pending matches only — tie-break when starting from queue. */
export function pendingSlotCounts(matches: MatchSummary[] | undefined) {
  const counts: Record<number, number> = {}
  if (!matches) return counts

  for (const match of matches) {
    if (match.status !== "pending") continue
    for (const p of [...(match.team_a || []), ...(match.team_b || [])]) {
      counts[p.id] = (counts[p.id] ?? 0) + 1
    }
  }
  return counts
}

export function compositeFairnessCounts(
  players: GamePlayer[],
  matches: MatchSummary[] | undefined,
  scheduledOverride?: Record<number, number>,
): Record<number, number> {
  const rotation = computeRotationCounts(matches)
  const scheduled = scheduledOverride ?? computeScheduledCounts(matches)
  const counts: Record<number, number> = {}
  for (const p of players) {
    const playedFinished = p.session_matches?.played ?? 0
    const playedLive = Math.max(playedFinished, rotation[p.id] ?? 0)
    counts[p.id] = playedLive * 1000 + (scheduled[p.id] ?? 0)
  }
  return counts
}

export function sessionMatchCountsFromPlayers(
  players: { id: number; session_matches?: PlayerSessionStats }[],
) {
  const counts: Record<number, PlayerSessionStats> = {}
  for (const p of players) {
    counts[p.id] = p.session_matches ?? { played: 0, wins: 0, losses: 0 }
  }
  return counts
}

/**
 * Player list "X trận": finished in this session (API) + ongoing on court if not yet in API.
 * Pending queue slots are excluded — batch "Xếp 10 trận" must not inflate totals before play.
 */
export function computePlayerDisplayCounts(
  players: { id: number; session_matches?: PlayerSessionStats }[],
  matches: MatchSummary[] | undefined,
): Record<number, PlayerSessionStats> {
  const base = sessionMatchCountsFromPlayers(players)
  const onCourt: Record<number, number> = {}

  for (const match of matches ?? []) {
    if (match.status !== "ongoing") continue
    for (const p of [...(match.team_a || []), ...(match.team_b || [])]) {
      onCourt[p.id] = (onCourt[p.id] ?? 0) + 1
    }
  }

  const counts: Record<number, PlayerSessionStats> = {}
  for (const p of players) {
    const b = base[p.id] ?? { played: 0, wins: 0, losses: 0 }
    const live = onCourt[p.id] ?? 0
    counts[p.id] = {
      ...b,
      played: b.played + live,
    }
  }
  return counts
}

function playerWonInMatch(playerId: number, match: MatchSummary): boolean | null {
  if (!match.winner_team) return null
  const inA = match.team_a.some((t) => t.id === playerId)
  const inB = match.team_b.some((t) => t.id === playerId)
  if ((match.winner_team === "team_a" && inA) || (match.winner_team === "team_b" && inB)) return true
  if (inA || inB) return false
  return null
}

/** Bump session_matches on game.players when a match is finished or undone locally. */
export function adjustSessionStatsForFinishedMatch<P extends { id: number; session_matches?: PlayerSessionStats }>(
  players: P[],
  match: MatchSummary,
  delta: 1 | -1,
): P[] {
  if (!match.winner_team) return players

  const participantIds = new Set(
    [...(match.team_a || []), ...(match.team_b || [])].map((p) => p.id),
  )
  if (participantIds.size === 0) return players

  return players.map((p) => {
    if (!participantIds.has(p.id)) return p
    const base = p.session_matches ?? { played: 0, wins: 0, losses: 0 }
    const won = playerWonInMatch(p.id, match)
    const next: PlayerSessionStats = {
      played: base.played + delta,
      wins: base.wins + (won === true ? delta : 0),
      losses: base.losses + (won === false ? delta : 0),
    }
    if (delta < 0) {
      next.played = Math.max(0, next.played)
      next.wins = Math.max(0, next.wins)
      next.losses = Math.max(0, next.losses)
    }
    return { ...p, session_matches: next }
  })
}
