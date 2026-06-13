import type { GameMatchCounts, GamePlayer, MatchSummary } from "@/lib/api"

export interface PlayerSessionStats {
  played: number
  wins: number
  losses: number
}

/** Finished matches only — drives played count and W-L on game detail. */
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

/** Keep tab badges in sync when only ongoing/pending are loaded but status changes over cable. */
export function applyLiveMatchCountDeltas(
  prevCounts: GameMatchCounts | undefined,
  prevMatches: MatchSummary[],
  nextMatches: MatchSummary[],
  finishedLoaded: boolean,
): GameMatchCounts {
  const base = matchCountsFromList(nextMatches, {
    fallbackFinished: prevCounts?.finished,
    finishedLoaded,
  })
  if (finishedLoaded) return base

  const prevById = new Map(prevMatches.map((m) => [m.id, m]))
  let finishedDelta = 0
  let ongoingDelta = 0
  let pendingDelta = 0

  for (const m of nextMatches) {
    const old = prevById.get(m.id)
    if (!old) {
      if (m.status === "pending") pendingDelta += 1
      else if (m.status === "ongoing") ongoingDelta += 1
      else if (m.status === "finished") finishedDelta += 1
      continue
    }
    if (old.status === m.status) continue
    if (old.status === "ongoing" && m.status === "finished") {
      finishedDelta += 1
      ongoingDelta -= 1
    } else if (old.status === "pending" && m.status === "ongoing") {
      pendingDelta -= 1
      ongoingDelta += 1
    } else if (old.status === "pending" && m.status === "finished") {
      pendingDelta -= 1
      finishedDelta += 1
    }
  }

  for (const old of prevMatches) {
    if (nextMatches.some((m) => m.id === old.id)) continue
    if (old.status === "pending") pendingDelta -= 1
    else if (old.status === "ongoing") ongoingDelta -= 1
    else if (old.status === "finished") finishedDelta -= 1
  }

  if (finishedDelta === 0 && ongoingDelta === 0 && pendingDelta === 0) return base

  return {
    pending: Math.max(0, (prevCounts?.pending ?? base.pending) + pendingDelta),
    ongoing: Math.max(0, (prevCounts?.ongoing ?? base.ongoing) + ongoingDelta),
    finished: Math.max(0, (prevCounts?.finished ?? 0) + finishedDelta),
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
  const finished = computePlayerMatchCounts(matches)
  const counts: Record<number, number> = {}
  for (const p of players) {
    counts[p.id] = Math.max(rotation[p.id] ?? 0, finished[p.id]?.played ?? 0)
  }
  return counts
}

/** Hide/disable pair-arrange action when session played spread reaches this (inclusive). */
export const PAIR_ARRANGE_MAX_SPREAD = 2

/** Max − min played in session (same basis as player list match count; excludes pending queue). */
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
  const finished = computePlayerMatchCounts(matches)
  const counts: Record<number, number> = {}
  for (const p of players) {
    const playedFinished = finished[p.id]?.played ?? 0
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
 * Legacy player list match count / W-L. Prefer API session stats because detail payload
 * only includes live/pending matches until the finished tab is loaded.
 */
export function computePlayerDisplayCounts(
  players: { id: number; session_matches?: PlayerSessionStats }[],
  matches: MatchSummary[] | undefined,
): Record<number, PlayerSessionStats> {
  if (players.some((p) => p.session_matches)) {
    return sessionMatchCountsFromPlayers(players)
  }

  const fromFinished = computePlayerMatchCounts(matches)
  const counts: Record<number, PlayerSessionStats> = {}

  for (const p of players) {
    counts[p.id] = fromFinished[p.id]
      ? { ...fromFinished[p.id] }
      : { played: 0, wins: 0, losses: 0 }
  }

  for (const match of matches ?? []) {
    if (match.status !== "ongoing") continue
    for (const p of [...(match.team_a || []), ...(match.team_b || [])]) {
      if (!counts[p.id]) counts[p.id] = { played: 0, wins: 0, losses: 0 }
      counts[p.id] = { ...counts[p.id], played: counts[p.id].played + 1 }
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
