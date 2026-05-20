import type { GamePlayer } from "../api"
import type { BalanceResult, DoublesGenderMode } from "./types"
import { DEFAULT_RATING, getRating } from "./rating"

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function combinations(arr: number[], size: number): number[][] {
  if (size === 0) return [[]]
  if (arr.length < size) return []
  const result: number[][] = []
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = combinations(arr.slice(i + 1), size - 1)
    for (const combo of rest) {
      result.push([arr[i], ...combo])
    }
  }
  return result
}

export function filterPoolByGender(players: GamePlayer[], mode: DoublesGenderMode): GamePlayer[] {
  if (mode === "any") return players
  if (mode === "mens") return players.filter((p) => p.gender === "male")
  if (mode === "womens") return players.filter((p) => p.gender === "female")
  return players.filter((p) => p.gender === "male" || p.gender === "female")
}

export function teamMatchesGenderMode(
  ids: number[],
  players: GamePlayer[],
  teamSize: number,
  mode: DoublesGenderMode,
): boolean {
  if (mode === "any" || teamSize !== 2) return true
  const genders = ids.map((id) => players.find((p) => p.id === id)?.gender)
  if (mode === "mens") return genders.every((g) => g === "male")
  if (mode === "womens") return genders.every((g) => g === "female")
  return genders.length === 2 && genders.includes("male") && genders.includes("female")
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function lineupKey(result: BalanceResult): string {
  return [...result.teamA, ...result.teamB].sort((a, b) => a - b).join(",")
}

export function selectByFewestMatches(
  players: GamePlayer[],
  count: number,
  matchCounts: Record<number, number>,
): GamePlayer[] {
  const grouped = new Map<number, GamePlayer[]>()
  for (const p of players) {
    const mc = matchCounts[p.id] ?? 0
    if (!grouped.has(mc)) grouped.set(mc, [])
    grouped.get(mc)!.push(p)
  }

  const sortedKeys = [...grouped.keys()].sort((a, b) => a - b)
  const result: GamePlayer[] = []
  for (const key of sortedKeys) {
    const group = shuffle(grouped.get(key)!)
    for (const p of group) {
      if (result.length >= count) break
      result.push(p)
    }
    if (result.length >= count) break
  }
  return result
}

export function isValidMixedRoster(rosterIds: number[], allPlayers: GamePlayer[]): boolean {
  let males = 0
  let females = 0
  for (const id of rosterIds) {
    const g = allPlayers.find((p) => p.id === id)?.gender
    if (g === "male") males += 1
    else if (g === "female") females += 1
  }
  return males === 2 && females === 2
}

export function bestSumFor(ids: number[], ratingMap: Map<number, number>): number {
  return ids.reduce((s, id) => s + (ratingMap.get(id) ?? DEFAULT_RATING), 0)
}

export function greedyPartition(
  players: GamePlayer[],
  teamSize: number,
  _genderMode: DoublesGenderMode,
  _allPlayers: GamePlayer[],
): BalanceResult {
  const shuffled = shuffle(players)
  const sorted = shuffled.sort((a, b) => getRating(b) - getRating(a))

  const teamA: number[] = []
  const teamB: number[] = []
  let sumA = 0
  let sumB = 0

  for (const p of sorted) {
    if (teamA.length >= teamSize && teamB.length >= teamSize) break

    if (teamA.length >= teamSize) {
      teamB.push(p.id)
      sumB += getRating(p)
    } else if (teamB.length >= teamSize) {
      teamA.push(p.id)
      sumA += getRating(p)
    } else if (sumA <= sumB) {
      teamA.push(p.id)
      sumA += getRating(p)
    } else {
      teamB.push(p.id)
      sumB += getRating(p)
    }
  }

  return { teamA, teamB }
}
