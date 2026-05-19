"use client"

import { createConsumer, type Consumer, type Subscription } from "@rails/actioncable"
import type { MatchSummary } from "@/lib/api"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "")

export type GameCableEvent =
  | { event: "match.created"; match: MatchSummary }
  | { event: "match.updated"; match: MatchSummary }
  | { event: "match.started"; match: MatchSummary }
  | { event: "match.finished"; match: MatchSummary }
  | { event: "match.undo"; match: MatchSummary }
  | { event: "match.deleted"; match_id: number }

let sharedConsumer: Consumer | null = null

function getConsumer(): Consumer {
  if (!sharedConsumer) {
    sharedConsumer = createConsumer(`${API_URL}/cable`)
  }
  return sharedConsumer
}

export type GameCableSubscribeOptions = {
  /** Invite link code — allows anonymous spectators on /join/[code] */
  inviteCode?: string
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
    received(data: GameCableEvent & { revision?: number }) {
      onEvent(data)
    },
  })
}

export function disconnectGameCable() {
  sharedConsumer?.disconnect()
  sharedConsumer = null
}
