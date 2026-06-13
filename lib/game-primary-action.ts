import type { Game } from "./api/types"

export type GamePrimaryActionKind = "cancel" | "leave" | "full" | "join"

interface GamePrimaryActionInput {
  game: Pick<Game, "status">
  isHost: boolean
  isParticipant: boolean
  isPast: boolean
}

export function getGamePrimaryActionKind({
  game,
  isHost,
  isParticipant,
  isPast,
}: GamePrimaryActionInput): GamePrimaryActionKind | null {
  if (game.status === "cancelled" || game.status === "finished" || isPast) return null

  if (isHost) {
    return game.status === "ongoing" ? null : "cancel"
  }

  if (isParticipant) {
    return game.status === "ongoing" ? null : "leave"
  }

  if (game.status === "full") return "full"

  return "join"
}
