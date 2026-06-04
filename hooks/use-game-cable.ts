"use client"

import { useEffect, useRef, useState } from "react"
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
): boolean {
  const [connected, setConnected] = useState(false)
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  const onConnectedRef = useRef(options?.onConnected)
  onConnectedRef.current = options?.onConnected

  const onDisconnectedRef = useRef(options?.onDisconnected)
  onDisconnectedRef.current = options?.onDisconnected

  const onRejectedRef = useRef(options?.onRejected)
  onRejectedRef.current = options?.onRejected

  const inviteCode = options?.inviteCode

  useEffect(() => {
    if (!enabled || gameId == null) {
      setConnected(false)
      return
    }

    let sub: Subscription | null = null
    try {
      sub = subscribeToGame(
        gameId,
        (payload) => handlerRef.current(payload),
        {
          inviteCode,
          onConnected: () => {
            setConnected(true)
            onConnectedRef.current?.()
          },
          onDisconnected: () => {
            setConnected(false)
            onDisconnectedRef.current?.()
          },
          onRejected: () => {
            setConnected(false)
            onRejectedRef.current?.()
          },
        },
      )
    } catch {
      setConnected(false)
      onDisconnectedRef.current?.()
    }

    return () => {
      sub?.unsubscribe()
      setConnected(false)
    }
  }, [gameId, enabled, inviteCode])

  return connected
}
