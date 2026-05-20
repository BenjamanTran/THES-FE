import type { MatchSummary } from "@/lib/api"

export type NextMatchSuggestion =
  | {
      kind: "start"
      match: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "create"
      teamA: number[]
      teamB: number[]
      label: string
      reason: string
    }
  | {
      kind: "queue"
      teamA: number[]
      teamB: number[]
      label: string
      reason: string
    }
  | {
      kind: "wait_court"
      match?: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "wait_players"
      match: MatchSummary
      label: string
      reason: string
    }
  | {
      kind: "batch"
      label: string
      reason: string
    }
