"use client"

import { useEffect, useRef } from "react"
import type { Subscription } from "@rails/actioncable"
import { subscribeToGame, type GameCableEvent } from "@/lib/game-cable"

export function useGameCable(
  gameId: number | null,
  onEvent: (payload: GameCableEvent) => void,
  enabled = true,
) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!enabled || gameId == null) return

    let sub: Subscription | null = null
    try {
      sub = subscribeToGame(gameId, (payload) => handlerRef.current(payload))
    } catch {
      // ActionCable unavailable — REST refresh still works
    }

    return () => {
      sub?.unsubscribe()
    }
  }, [gameId, enabled])
}
