import type { GamePlayer, MatchSummary } from "@/lib/api"
import { playerDisplayName } from "@/lib/player-display-name"

export function formatMatchLabel(match: MatchSummary) {
  const names = [...match.team_a, ...match.team_b].map((p) => playerDisplayName(p.name, p.id))
  return `Trận ${match.match_number}: ${names.join(" · ")}`
}

export function formatTeamsLabel(
  teamAIds: number[],
  teamBIds: number[],
  players: GamePlayer[],
) {
  const name = (id: number) => {
    const p = players.find((pl) => pl.id === id)
    return playerDisplayName(p?.name, id)
  }
  const a = teamAIds.map(name).join(" & ")
  const b = teamBIds.map(name).join(" & ")
  return `${a} vs ${b}`
}
