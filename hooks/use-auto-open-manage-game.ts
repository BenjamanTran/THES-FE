"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { AuthUser } from "@/lib/api"

/** Set when user closes game detail — skip auto-open for that game until session ends or game changes. */
export const DISMISS_MANAGE_GAME_KEY = "smashhub:dismiss_manage_game"

export function dismissManageGame(gameId: number) {
  sessionStorage.setItem(DISMISS_MANAGE_GAME_KEY, String(gameId))
}

export function clearDismissManageGame() {
  sessionStorage.removeItem(DISMISS_MANAGE_GAME_KEY)
}

function isManageGameDismissed(gameId: number): boolean {
  return sessionStorage.getItem(DISMISS_MANAGE_GAME_KEY) === String(gameId)
}

/**
 * Opens game detail when user is host/co-host of a live session.
 * Refresh keeps detail open via ?game= in URL; closing sheet sets dismiss flag.
 */
export function useAutoOpenManageGame(
  user: AuthUser | null,
  loading: boolean,
  openGame: (gameId: number) => void,
) {
  const searchParams = useSearchParams()
  const didOpenRef = useRef(false)

  useEffect(() => {
    if (loading || !user || user.guest || didOpenRef.current) return

    const fromUrl = searchParams.get("game")
    if (fromUrl) {
      const id = Number(fromUrl)
      if (id > 0) didOpenRef.current = true
      return
    }

    const active = user.active_manage_game
    if (!active?.id) {
      clearDismissManageGame()
      return
    }

    if (isManageGameDismissed(active.id)) return

    didOpenRef.current = true
    openGame(active.id)
  }, [loading, user, searchParams, openGame])
}
