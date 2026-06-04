import type { GameDetail, MatchSummary } from "@/lib/api"
import { getMaxCourts } from "@/lib/suggest-next-match/start-rules"

/** Max pending matches = configured courts (2 courts → max 2 in queue). */
export function maxPendingQueueSlots(game: Pick<GameDetail, "courts">): number {
  return getMaxCourts(game)
}

export function countPendingMatches(matches: MatchSummary[] | undefined): number {
  return (matches ?? []).filter((m) => m.status === "pending").length
}

export function canAddPendingMatch(
  game: Pick<GameDetail, "courts">,
  matches: MatchSummary[] | undefined,
): boolean {
  return countPendingMatches(matches) < maxPendingQueueSlots(game)
}

export function pendingQueueFullMessage(game: Pick<GameDetail, "courts">): string {
  const limit = maxPendingQueueSlots(game)
  return `Hàng chờ đầy (${limit}/${limit}) — bắt đầu hoặc xóa trận chờ trước`
}

export function pendingQueueStatusLabel(
  game: Pick<GameDetail, "courts">,
  matches: MatchSummary[] | undefined,
): string {
  const limit = maxPendingQueueSlots(game)
  const count = countPendingMatches(matches)
  return `Hàng chờ ${count}/${limit}`
}
