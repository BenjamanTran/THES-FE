type MatchCourtInput = {
  id: number
  match_number: number
  status: "pending" | "ongoing" | "finished"
  court_number?: number | null
  priority?: boolean
}

function normalizedCourts(
  gameCourts: number[] | null | undefined,
  matches: MatchCourtInput[],
): number[] {
  const list = (gameCourts ?? [])
    .map((c) => Number(c))
    .filter((c) => Number.isFinite(c) && c > 0)
  const unique = [...new Set(list)].sort((a, b) => a - b)
  if (unique.length > 0) return unique

  const ongoing = matches.filter((m) => m.status === "ongoing").length
  const slots = Math.max(ongoing + 1, 4)
  return Array.from({ length: slots }, (_, i) => i + 1)
}

function sortPending(a: MatchCourtInput, b: MatchCourtInput) {
  if (a.priority !== b.priority) return a.priority ? -1 : 1
  return a.match_number - b.match_number || a.id - b.id
}

/** Court count for display: from DB when set, else inferred from game courts + ongoing/pending matches. */
export function resolveDisplayCourtNumber(
  match: MatchCourtInput,
  allMatches: MatchCourtInput[],
  gameCourts?: number[] | null,
): number | null {
  if (match.court_number != null) return match.court_number

  const courts = normalizedCourts(gameCourts, allMatches)
  const ongoing = allMatches.filter((m) => m.status === "ongoing")
  const taken = new Set(
    ongoing.map((m) => m.court_number).filter((n): n is number => n != null),
  )

  if (match.status === "ongoing") {
    const orphans = ongoing
      .filter((m) => m.court_number == null)
      .sort((a, b) => a.match_number - b.match_number || a.id - b.id)
    const free = courts.filter((c) => !taken.has(c))
    const idx = orphans.findIndex((m) => m.id === match.id)
    if (idx >= 0 && free[idx] != null) return free[idx]
    return free[0] ?? null
  }

  if (match.status === "pending") {
    const free = courts.filter((c) => !taken.has(c))
    if (free.length === 0) return null
    const pending = allMatches.filter((m) => m.status === "pending").sort(sortPending)
    const idx = pending.findIndex((m) => m.id === match.id)
    if (idx >= 0 && idx < free.length) return free[idx]
    return free[0]
  }

  return null
}
