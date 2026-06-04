import type { NextMatchSuggestion } from "./types"

/** Stable key for enter animation when suggest sticky content changes. */
export function suggestionAnimateKey(
  suggestion: NextMatchSuggestion | null | undefined,
): string {
  if (!suggestion) return "none"
  switch (suggestion.kind) {
    case "start":
      return `start-${suggestion.match.id}`
    case "wait_court":
      return `wait-court-${suggestion.match?.id ?? "none"}`
    case "wait_players":
      return `wait-players-${suggestion.match.id}`
    case "create":
    case "queue":
      return `${suggestion.kind}-${suggestion.teamA.join("-")}-${suggestion.teamB.join("-")}`
    default:
      return suggestion.kind
  }
}
