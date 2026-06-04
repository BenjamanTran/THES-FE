import type { MatchSummary } from "@/lib/api"

export type SuggestQueueAction = {
  teamA: number[]
  teamB: number[]
  label: string
  reason: string
}

export type NextMatchSuggestion =
  | {
      kind: "start"
      match: MatchSummary
      label: string
      reason: string
      /** Optional next pending lineup (pipeline; may overlap with on-court players). */
      altQueue?: SuggestQueueAction
    }
  | {
      kind: "create"
      teamA: number[]
      teamB: number[]
      label: string
      reason: string
      altQueue?: SuggestQueueAction
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
