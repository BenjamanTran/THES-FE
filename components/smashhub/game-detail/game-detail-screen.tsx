"use client"

import { useGameDetail } from "./use-game-detail"
import { GameDetailView } from "./game-detail-view"

interface GameDetailScreenProps {
  gameId: number | null
  onClose: () => void
}

export function GameDetailScreen({ gameId, onClose }: GameDetailScreenProps) {
  const vm = useGameDetail(gameId, onClose)
  return <GameDetailView vm={vm} />
}
