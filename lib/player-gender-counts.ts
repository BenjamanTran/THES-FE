import type { GamePlayer, Gender } from "@/lib/api"

/** Female first, then male, then unspecified/other. */
export function genderSortOrder(gender?: Gender): number {
  if (gender === "female") return 0
  if (gender === "male") return 1
  return 2
}

export function sortPlayersByGenderThenName<T extends Pick<GamePlayer, "gender" | "name">>(
  players: T[],
): T[] {
  return [...players].sort((a, b) => {
    const byGender = genderSortOrder(a.gender) - genderSortOrder(b.gender)
    if (byGender !== 0) return byGender
    return (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" })
  })
}

export function countPlayersByGender(players: Pick<GamePlayer, "gender">[]) {
  let male = 0
  let female = 0
  for (const p of players) {
    if (p.gender === "male") male += 1
    else if (p.gender === "female") female += 1
  }
  return { male, female }
}

/** e.g. "3 nam, 2 nữ" — null when no male/female recorded. */
export function formatPlayerGenderLabel(counts: { male: number; female: number }): string | null {
  const parts: string[] = []
  if (counts.male > 0) parts.push(`${counts.male} nam`)
  if (counts.female > 0) parts.push(`${counts.female} nữ`)
  return parts.length > 0 ? parts.join(", ") : null
}
