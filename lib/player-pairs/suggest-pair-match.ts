import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { calcFairness } from "@/lib/balance"
import { PAIR_ARRANGE_MAX_SPREAD, sessionPlayedSpread } from "@/lib/match-stats"
import { suggestPipelineQueueLineup } from "@/lib/suggest-next-match/pipeline-queue"
import { getOngoingBusyIds } from "@/lib/suggest-next-match/start-rules"
import { playerDisplayName } from "@/lib/player-display-name"
import { formatTeamsLabel } from "@/lib/suggest-next-match/labels"
import { pairsFromGame, type PlayerPair } from "./types"

function isRegisteredPairSide(ids: number[], pairs: PlayerPair[]): boolean {
  if (ids.length !== 2) return false
  const [a, b] = ids
  return pairs.some(
    (p) =>
      (p.userA === a && p.userB === b) ||
      (p.userA === b && p.userB === a),
  )
}

function pairForSide(ids: number[], pairs: PlayerPair[]): PlayerPair | null {
  if (ids.length !== 2) return null
  const [a, b] = ids
  return (
    pairs.find(
      (p) =>
        (p.userA === a && p.userB === b) ||
        (p.userA === b && p.userB === a),
    ) ?? null
  )
}

/** Both sides are registered pairs and all four are off court (with pair quota). */
export function tryRegisteredPairLineup(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
  teamA: number[],
  teamB: number[],
): PairMatchSuggestion | null {
  if (game.match_type !== "doubles") return null
  const pairs = pairsFromGame(game.player_pairs)
  if (!pairs.length) return null

  const busyIds = getOngoingBusyIds(matches)
  const freeIds = new Set(players.filter((p) => !busyIds.has(p.id)).map((p) => p.id))
  if (!isRegisteredPairSide(teamA, pairs) || !isRegisteredPairSide(teamB, pairs)) {
    return null
  }
  if (![...teamA, ...teamB].every((id) => freeIds.has(id))) return null

  const limit = game.pair_matches_limit
  const pA = pairForSide(teamA, pairs)
  const pB = pairForSide(teamB, pairs)
  if (!pA || !pB || !pairHasQuota(pA, limit) || !pairHasQuota(pB, limit)) return null

  const fair = calcFairness(teamA, teamB, players)
  return {
    teamA,
    teamB,
    label: formatTeamsLabel(teamA, teamB, players),
    reason: `2 cặp rảnh — cân trình độ (chênh ${fair.diff} điểm TB). Cả 4 người không trên sân.`,
  }
}

function pairHasQuota(pair: PlayerPair, limit: number | null | undefined): boolean {
  if (limit == null) return true
  return (pair.matchesUsed ?? 0) < limit
}

export function pairQuotaLabel(
  pair: PlayerPair,
  limit: number | null | undefined,
): string | null {
  if (limit == null) return null
  const used = pair.matchesUsed ?? 0
  const exhausted = used >= limit
  return `${used}/${limit}${exhausted ? " · hết" : ""}`
}

export type PairMatchSuggestion = {
  teamA: number[]
  teamB: number[]
  label: string
  reason: string
}

export type PairMatchSuggestionError = {
  error: string
}

function lineupFromTwoPairs(
  pair1: PlayerPair,
  pair2: PlayerPair,
  players: GamePlayer[],
): { teamA: number[]; teamB: number[] } {
  const p1 = [pair1.userA, pair1.userB] as [number, number]
  const p2 = [pair2.userA, pair2.userB] as [number, number]
  const optA = { teamA: [...p1], teamB: [...p2] }
  const optB = { teamA: [...p2], teamB: [...p1] }
  const diffA = calcFairness(optA.teamA, optA.teamB, players).diff
  const diffB = calcFairness(optB.teamA, optB.teamB, players).diff
  return diffA <= diffB ? optA : optB
}

/** Registered pair on the same side of one ongoing match (doubles). */
function pairOnSameOngoingSide(
  pair: PlayerPair,
  matches: MatchSummary[],
): boolean {
  for (const m of matches.filter((x) => x.status === "ongoing")) {
    for (const side of [m.team_a, m.team_b]) {
      const ids = side.map((p) => p.id)
      if (ids.includes(pair.userA) && ids.includes(pair.userB)) return true
    }
  }
  return false
}

/** Opponent duos: two free players, or both from one side of a single ongoing match. */
function opponentDuosForPair(
  free: GamePlayer[],
  matches: MatchSummary[],
  excludeIds: Set<number>,
): [number, number][] {
  const duos: [number, number][] = []
  const pool = free.filter((p) => !excludeIds.has(p.id))
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      duos.push([pool[i].id, pool[j].id])
    }
  }
  for (const m of matches.filter((x) => x.status === "ongoing")) {
    for (const side of [m.team_a, m.team_b]) {
      if (side.length !== 2) continue
      const ids = side.map((p) => p.id) as [number, number]
      if (excludeIds.has(ids[0]) || excludeIds.has(ids[1])) continue
      duos.push(ids)
    }
  }
  return duos
}

function lineupFromOnePair(
  pair: PlayerPair,
  opponentDuos: [number, number][],
  players: GamePlayer[],
): { teamA: number[]; teamB: number[] } | null {
  if (opponentDuos.length === 0) return null
  const pIds: [number, number] = [pair.userA, pair.userB]
  let best: { teamA: number[]; teamB: number[] } | null = null
  let bestDiff = Infinity

  for (const [s1, s2] of opponentDuos) {
    const candidates = [
      { teamA: [...pIds], teamB: [s1, s2] },
      { teamA: [s1, s2], teamB: [...pIds] },
    ]
    for (const c of candidates) {
      const diff = calcFairness(c.teamA, c.teamB, players).diff
      if (diff < bestDiff) {
        bestDiff = diff
        best = c
      }
    }
  }
  return best
}

/** Find a doubles lineup keeping registered pairs on each side; all four not on court. */
export function suggestPairDoublesMatch(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
): PairMatchSuggestion | PairMatchSuggestionError {
  if (game.match_type !== "doubles") {
    return { error: "Chỉ áp dụng cho trận đôi" }
  }

  const playedSpread = sessionPlayedSpread(players, matches)
  if (playedSpread >= PAIR_ARRANGE_MAX_SPREAD) {
    return {
      error: `Lệch ${playedSpread} trận — cân lượt trước`,
    }
  }

  const pairs = pairsFromGame(game.player_pairs)
  if (pairs.length === 0) {
    return { error: "Chưa ghép cặp — chạm 2 người trong danh sách" }
  }

  if (!canArrangePairMatch(game)) {
    const limit = game.pair_matches_limit
    return { error: `Mọi cặp đã đủ ${limit} trận giữ cặp` }
  }

  const busyIds = getOngoingBusyIds(matches)
  const free = players.filter((p) => !busyIds.has(p.id))
  const freeIds = new Set(free.map((p) => p.id))

  const limit = game.pair_matches_limit
  const readyPairs = pairs.filter(
    (p) =>
      freeIds.has(p.userA) &&
      freeIds.has(p.userB) &&
      pairHasQuota(p, limit),
  )

  if (readyPairs.length >= 2) {
    let best: { teamA: number[]; teamB: number[] } | null = null
    let bestDiff = Infinity
    for (let i = 0; i < readyPairs.length; i++) {
      for (let j = i + 1; j < readyPairs.length; j++) {
        const lineup = lineupFromTwoPairs(readyPairs[i], readyPairs[j], players)
        const diff = calcFairness(lineup.teamA, lineup.teamB, players).diff
        if (diff < bestDiff) {
          bestDiff = diff
          best = lineup
        }
      }
    }
    if (best) {
      const fair = calcFairness(best.teamA, best.teamB, players)
      return {
        teamA: best.teamA,
        teamB: best.teamB,
        label: formatTeamsLabel(best.teamA, best.teamB, players),
        reason: `2 cặp rảnh — cân trình độ (chênh ${fair.diff} điểm TB). Cả 4 người không trên sân.`,
      }
    }
  }

  const onePairCandidates = pairs.filter(
    (p) =>
      pairHasQuota(p, limit) &&
      ((freeIds.has(p.userA) && freeIds.has(p.userB)) ||
        pairOnSameOngoingSide(p, matches)),
  )

  if (onePairCandidates.length >= 1) {
    let bestSuggestion: PairMatchSuggestion | null = null
    let bestDiff = Infinity

    for (const pair of onePairCandidates) {
      const exclude = new Set([pair.userA, pair.userB])
      const duos = opponentDuosForPair(free, matches, exclude)
      const lineup = lineupFromOnePair(pair, duos, players)
      if (!lineup) continue
      const diff = calcFairness(lineup.teamA, lineup.teamB, players).diff
      if (diff < bestDiff) {
        bestDiff = diff
        bestSuggestion = {
          teamA: lineup.teamA,
          teamB: lineup.teamB,
          label: formatTeamsLabel(lineup.teamA, lineup.teamB, players),
          reason: `1 cặp + đôi đối — cân trình độ (chênh ${diff} điểm TB).`,
        }
      }
    }
    if (bestSuggestion) return bestSuggestion
  }

  const pipeline = suggestPipelineQueueLineup(game, players, matches)
  if (pipeline) {
    const fromPipeline = tryRegisteredPairLineup(
      game,
      players,
      matches,
      pipeline.teamA,
      pipeline.teamB,
    )
    if (fromPipeline) return fromPipeline
  }

  const onCourt = busyIds.size > 0

  if (free.length >= 4) {
    return {
      error: onCourt
        ? "Cặp đang đánh — chờ xuống sân, hoặc Thêm hàng chờ."
        : "Chưa ghép đủ 2 cặp rảnh — chạm 2 người để ghép, hoặc Thêm hàng chờ.",
    }
  }

  if (onCourt) {
    return { error: "Chờ người xuống sân, hoặc Thêm hàng chờ." }
  }
  if (limit != null && pairs.some((p) => freeIds.has(p.userA) && freeIds.has(p.userB))) {
    return { error: `Các cặp đã đủ ${limit} trận giữ cặp` }
  }
  return { error: "Chưa đủ 2 cặp cùng rảnh" }
}

export function canArrangePairMatch(game: GameDetail): boolean {
  if (game.match_type !== "doubles") return false
  const pairs = pairsFromGame(game.player_pairs)
  if (!pairs.length) return false
  const limit = game.pair_matches_limit
  if (limit == null) return true
  return pairs.some((p) => pairHasQuota(p, limit))
}
