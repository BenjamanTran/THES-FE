import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { calcFairness } from "@/lib/balance"
import { PAIR_ARRANGE_MAX_SPREAD, sessionPlayedSpread } from "@/lib/match-stats"
import { getOngoingBusyIds } from "@/lib/suggest-next-match/start-rules"
import { playerDisplayName } from "@/lib/player-display-name"
import { formatTeamsLabel } from "@/lib/suggest-next-match/labels"
import { pairsFromGame, type PlayerPair } from "./types"

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

function lineupFromOnePair(
  pair: PlayerPair,
  singles: GamePlayer[],
  players: GamePlayer[],
): { teamA: number[]; teamB: number[] } | null {
  if (singles.length < 2) return null
  const pIds: [number, number] = [pair.userA, pair.userB]
  let best: { teamA: number[]; teamB: number[] } | null = null
  let bestDiff = Infinity

  for (let i = 0; i < singles.length; i++) {
    for (let j = i + 1; j < singles.length; j++) {
      const s1 = singles[i].id
      const s2 = singles[j].id
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
      error: `Lệch ${playedSpread} trận — ưu tiên cân lượt trước khi sắp xếp cặp`,
    }
  }

  const pairs = pairsFromGame(game.player_pairs)
  if (pairs.length === 0) {
    return { error: "Chưa có cặp đánh chung — ghép cặp trước" }
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

  if (readyPairs.length === 1) {
    const pair = readyPairs[0]
    const singles = free.filter((p) => p.id !== pair.userA && p.id !== pair.userB)
    const lineup = lineupFromOnePair(pair, singles, players)
    if (lineup) {
      const fair = calcFairness(lineup.teamA, lineup.teamB, players)
      const pairNames = [pair.userA, pair.userB]
        .map((id) => playerDisplayName(players.find((p) => p.id === id)?.name, id))
        .join("–")
      return {
        teamA: lineup.teamA,
        teamB: lineup.teamB,
        label: formatTeamsLabel(lineup.teamA, lineup.teamB, players),
        reason: `Cặp ${pairNames} cùng phe — cân với 2 người rảnh (chênh ${fair.diff} điểm TB).`,
      }
    }
    return { error: "Cần thêm 2 người rảnh (không trên sân) để ghép với cặp" }
  }

  const onCourt = players.filter((p) => busyIds.has(p.id)).map((p) => p.name || `#${p.id}`)
  if (onCourt.length > 0) {
    return { error: `Chờ cặp rảnh — đang trên sân: ${onCourt.slice(0, 3).join(", ")}` }
  }
  if (limit != null && pairs.some((p) => freeIds.has(p.userA) && freeIds.has(p.userB))) {
    return { error: `Các cặp rảnh đã đủ ${limit} trận giữ cặp` }
  }
  return { error: "Không đủ cặp rảnh (cả hai người trong cặp phải không trên sân)" }
}

export function canArrangePairMatch(game: GameDetail): boolean {
  if (game.match_type !== "doubles") return false
  const pairs = pairsFromGame(game.player_pairs)
  if (!pairs.length) return false
  const limit = game.pair_matches_limit
  if (limit == null) return true
  return pairs.some((p) => pairHasQuota(p, limit))
}
