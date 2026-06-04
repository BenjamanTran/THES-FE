import type { MatchSummary } from "@/lib/api"

/** Queue order: ★ priority first, then earliest match_number. */
export function sortPendingQueue(matches: MatchSummary[]): MatchSummary[] {
  return [...matches].sort((a, b) => {
    if (Boolean(a.priority) !== Boolean(b.priority)) {
      return a.priority ? -1 : 1
    }
    return a.match_number - b.match_number
  })
}
