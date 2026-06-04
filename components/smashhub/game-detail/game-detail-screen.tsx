"use client"

import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useGameDetail } from "./use-game-detail"
import { GameDetailView } from "./game-detail-view"
import { useGameDetailSimple } from "./use-game-detail-simple"
import { GameDetailSimpleView } from "./game-detail-simple-view"
import { useGameDetailVariant } from "@/hooks/use-game-detail-variant"

interface GameDetailScreenProps {
  gameId: number | null
  onClose: () => void
}

function GameDetailLegacy({ gameId, onClose }: GameDetailScreenProps) {
  const vm = useGameDetail(gameId, onClose)
  return <GameDetailView vm={vm} />
}

function GameDetailSimpleRoute({ gameId, onClose }: GameDetailScreenProps) {
  const vm = useGameDetailSimple(gameId, onClose)
  return <GameDetailSimpleView vm={vm} />
}

function GameDetailVariantLoading({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md mx-auto h-[100dvh] sm:h-[90dvh] flex flex-col items-center justify-center p-0 gap-0 rounded-none sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">Đang tải</DialogTitle>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </DialogContent>
    </Dialog>
  )
}

export function GameDetailScreen({ gameId, onClose }: GameDetailScreenProps) {
  const open = gameId !== null
  const { variant, loading } = useGameDetailVariant(open)

  if (!open) return null

  if (loading) {
    return <GameDetailVariantLoading onClose={onClose} />
  }

  if (variant === "legacy") {
    return <GameDetailLegacy gameId={gameId} onClose={onClose} />
  }

  return <GameDetailSimpleRoute gameId={gameId} onClose={onClose} />
}
