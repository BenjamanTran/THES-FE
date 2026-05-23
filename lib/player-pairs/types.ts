import type { GamePlayer, GamePlayerPair } from "@/lib/api"

export interface PlayerPair {
  id?: number
  userA: number
  userB: number
  matchesUsed?: number
}

/** Used only by balanceTeams when explicitly arranging pair matches */
export interface PairBalanceOptions {
  pairs?: PlayerPair[]
  pairPolicy?: "prefer" | "require"
}

export function pairsFromGame(
  pairs: GamePlayerPair[] | undefined,
): PlayerPair[] {
  if (!pairs?.length) return []
  return pairs
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      userA: p.user_a_id,
      userB: p.user_b_id,
      matchesUsed: p.matches_used ?? 0,
    }))
}

export function partnerIdFor(playerId: number, pairs: PlayerPair[]): number | null {
  for (const p of pairs) {
    if (p.userA === playerId) return p.userB
    if (p.userB === playerId) return p.userA
  }
  return null
}

export function pairLabel(
  pair: PlayerPair,
  players: GamePlayer[],
): string {
  const name = (id: number) =>
    players.find((p) => p.id === id)?.name?.trim() || `#${id}`
  return `${name(pair.userA)}–${name(pair.userB)}`
}
