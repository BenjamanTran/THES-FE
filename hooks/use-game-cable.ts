"use client"

import { useEffect, useRef } from "react"
import type { Subscription } from "@rails/actioncable"
import {
  subscribeToGame,
  type GameCableEvent,
  type GameCableSubscribeOptions,
} from "@/lib/game-cable"

export function useGameCable(
  gameId: number | null,
  onEvent: (payload: GameCableEvent) => void,
  enabled = true,
  options?: GameCableSubscribeOptions,
) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  const onConnectedRef = useRef(options?.onConnected)
  onConnectedRef.current = options?.onConnected

  const onDisconnectedRef = useRef(options?.onDisconnected)
  onDisconnectedRef.current = options?.onDisconnected

  const inviteCode = options?.inviteCode

  useEffect(() => {
    if (!enabled || gameId == null) return

    let sub: Subscription | null = null
    try {
      sub = subscribeToGame(
        gameId,
        (payload) => handlerRef.current(payload),
        {
          inviteCode,
          onConnected: () => onConnectedRef.current?.(),
          onDisconnected: () => onDisconnectedRef.current?.(),
        },
      )
    } catch {
      onDisconnectedRef.current?.()
    }

    return () => {
      sub?.unsubscribe()
    }
  }, [gameId, enabled, inviteCode])
}
