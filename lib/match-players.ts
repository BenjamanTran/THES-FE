import type { GamePlayer } from "@/lib/api"

/** Players host marked as present at the venue — used for matchmaking only. */
export function playersArrivedAtCourt(players: GamePlayer[] | undefined): GamePlayer[] {
  return (players ?? []).filter((p) => p.arrived_at_court)
}

export function minPlayersForMatchType(matchType: "singles" | "doubles"): number {
  return matchType === "singles" ? 2 : 4
}

export function hasEnoughArrivedPlayers(
  players: GamePlayer[] | undefined,
  matchType: "singles" | "doubles",
): boolean {
  return playersArrivedAtCourt(players).length >= minPlayersForMatchType(matchType)
}
