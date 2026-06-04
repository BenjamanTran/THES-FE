"use client"

import { createConsumer, type Consumer, type Subscription } from "@rails/actioncable"
import type { GamePlayer, MatchSummary } from "@/lib/api"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "")

export type GameCableEvent =
  | { event: "match.created"; match: MatchSummary }
  | { event: "match.updated"; match: MatchSummary }
  | { event: "match.started"; match: MatchSummary }
  | { event: "match.finished"; match: MatchSummary }
  | { event: "match.undo"; match: MatchSummary }
  | { event: "match.deleted"; match_id: number }
  | { event: "player.session_played"; player: GamePlayer }
  | { event: "game.refresh" }

let sharedConsumer: Consumer | null = null

function cableWebSocketUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const api = new URL(API_URL)
      api.protocol = api.protocol === "https:" ? "wss:" : "ws:"
      api.pathname = "/cable"
      return api.toString()
    } catch {
      // fall through
    }
  }
  return API_URL.replace(/^http/, "ws") + "/cable"
}

function getConsumer(): Consumer {
  if (!sharedConsumer) {
    sharedConsumer = createConsumer(cableWebSocketUrl())
  }
  return sharedConsumer
}

export type GameCableSubscribeOptions = {
  /** Invite link code — allows anonymous spectators on /join/[code] */
  inviteCode?: string
  onConnected?: () => void
  onDisconnected?: () => void
  /** Server rejected subscription (e.g. not logged in or not in game roster). */
  onRejected?: () => void
}

export function subscribeToGame(
  gameId: number,
  onEvent: (payload: GameCableEvent & { revision?: number }) => void,
  options?: GameCableSubscribeOptions,
): Subscription {
  const params: Record<string, string | number> = { channel: "GameChannel", game_id: gameId }
  if (options?.inviteCode) {
    params.invite_code = options.inviteCode
  }

  return getConsumer().subscriptions.create(params, {
    connected() {
      options?.onConnected?.()
    },
    disconnected() {
      options?.onDisconnected?.()
    },
    rejected() {
      options?.onRejected?.()
    },
    received(data: GameCableEvent & { revision?: number }) {
      onEvent(data)
    },
  })
}

export function disconnectGameCable() {
  sharedConsumer?.disconnect()
  sharedConsumer = null
}
