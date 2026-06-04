import type { GameDetail, GamePlayer, MatchSummary } from "@/lib/api"
import { canAddPendingMatch } from "@/lib/match-queue-capacity"
import { sortPendingQueue } from "@/lib/match-queue-order"
import { balanceTeams } from "@/lib/balance"
import { playerDisplayName } from "@/lib/player-display-name"
import { formatMatchLabel, formatTeamsLabel } from "./labels"
import { rotationFairnessCounts } from "@/lib/match-stats"
import { suggestPipelineQueueLineup } from "./pipeline-queue"
import {
  filterStartablePending,
  getMatchStartBlockers,
  getOngoingBusyIds,
  pickNextPendingForQueue,
} from "./start-rules"
import type { NextMatchSuggestion, SuggestQueueAction } from "./types"

function idealLineup(
  players: GamePlayer[],
  teamSize: number,
  fairness: Record<number, number>,
) {
  const { teamA, teamB } = balanceTeams(players, teamSize, fairness)
  if (teamA.length < teamSize || teamB.length < teamSize) return null
  return { teamA, teamB }
}

function fairnessReason(
  teamA: number[],
  teamB: number[],
  players: GamePlayer[],
  fairness: Record<number, number>,
) {
  const loads = [...teamA, ...teamB].map((id) => fairness[id] ?? 0)
  const minLoad = Math.min(...loads)
  const ids = [...teamA, ...teamB]
  const names = ids
    .filter((id) => (fairness[id] ?? 0) === minLoad)
    .map((id) => playerDisplayName(players.find((p) => p.id === id)?.name, id))
    .slice(0, 3)
  if (names.length === 0) return "Cân bằng lượt chơi trong buổi"
  return `Ưu tiên ${names.join(", ")}`
}

function fairnessReasonForMatch(
  match: MatchSummary,
  players: GamePlayer[],
  fairness: Record<number, number>,
) {
  return fairnessReason(
    match.team_a.map((p) => p.id),
    match.team_b.map((p) => p.id),
    players,
    fairness,
  )
}

/** Optional secondary queue action when a pending slot is still available. */
function altQueueForPipeline(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
): SuggestQueueAction | undefined {
  if (!canAddPendingMatch(game, matches)) return undefined
  const pipeline = suggestPipelineQueueLineup(game, players, matches)
  if (!pipeline) return undefined
  return {
    teamA: pipeline.teamA,
    teamB: pipeline.teamB,
    label: pipeline.label,
    reason: pipeline.reason,
  }
}

export function getQueueLineupFromSuggestion(
  suggestion: NextMatchSuggestion | null | undefined,
): { teamA: number[]; teamB: number[] } | null {
  if (!suggestion) return null
  if (suggestion.kind === "queue") {
    return { teamA: suggestion.teamA, teamB: suggestion.teamB }
  }
  if (
    (suggestion.kind === "start" || suggestion.kind === "create") &&
    suggestion.altQueue
  ) {
    return {
      teamA: suggestion.altQueue.teamA,
      teamB: suggestion.altQueue.teamB,
    }
  }
  return null
}

export function suggestNextMatch(
  game: GameDetail,
  players: GamePlayer[],
  matches: MatchSummary[],
): NextMatchSuggestion | null {
  const teamSize = game.match_type === "singles" ? 1 : 2
  const needed = teamSize * 2
  if (players.length < needed) return null

  const startFairness = rotationFairnessCounts(players, matches)
  const ongoing = matches.filter((m) => m.status === "ongoing")
  const pending = sortPendingQueue(matches.filter((m) => m.status === "pending"))

  const maxCourts = Math.max(1, game.courts?.length ?? 1)
  const canStartMore = ongoing.length < maxCourts
  const busyIds = getOngoingBusyIds(matches)
  const freePlayers = players.filter((p) => !busyIds.has(p.id))
  const queueHasRoom = canAddPendingMatch(game, matches)
  const pipelineQueue = queueHasRoom
    ? suggestPipelineQueueLineup(game, players, matches)
    : null
  const idealCreate =
    freePlayers.length >= needed
      ? idealLineup(freePlayers, teamSize, startFairness)
      : null
  const activePlayerIds = new Set(players.map((p) => p.id))
  const startablePending = filterStartablePending(
    pending,
    busyIds,
    activePlayerIds,
    needed,
  )

  if (pending.length > 0) {
    const nextOnCourt = pickNextPendingForQueue(pending, startablePending)
    const queueOrder = pending
      .map((m) => (m.priority ? `★#${m.match_number}` : `#${m.match_number}`))
      .join(" → ")

    if (!canStartMore) {
      if (pipelineQueue) {
        return {
          kind: "queue",
          teamA: pipelineQueue.teamA,
          teamB: pipelineQueue.teamB,
          label: pipelineQueue.label,
          reason: `${pipelineQueue.reason}. Sân đầy (${ongoing.length}/${maxCourts}) — tiếp theo: Trận #${nextOnCourt.match_number}.`,
        }
      }
      const capNote = queueHasRoom
        ? ""
        : ` Hàng chờ đầy (${pending.length}/${maxCourts}).`
      return {
        kind: "wait_court",
        match: nextOnCourt,
        label: formatMatchLabel(nextOnCourt),
        reason: `Sân đầy (${ongoing.length}/${maxCourts}) — kết thúc trận trên sân, bắt đầu Trận #${nextOnCourt.match_number} (${queueOrder}).${capNote}`,
      }
    }

    if (startablePending.length > 0) {
      const match = pickNextPendingForQueue(pending, startablePending)
      const matchReason = fairnessReasonForMatch(match, players, startFairness)
      const readyOrder = sortPendingQueue(startablePending)
        .map((m) => (m.priority ? `★#${m.match_number}` : `#${m.match_number}`))
        .join(" → ")
      return {
        kind: "start",
        match,
        label: formatMatchLabel(match),
        reason: `Bắt đầu từ hàng chờ: ${readyOrder}. ${matchReason}`,
      }
    }

    const blockers = getMatchStartBlockers(nextOnCourt, ongoing)
    const freeCourts = Math.max(0, maxCourts - ongoing.length)
    const waitDetail =
      blockers.length > 0
        ? `Trận #${nextOnCourt.match_number} chờ ${blockers.map((b) => b.playerName).join(", ")} xong (đang #${blockers[0]!.ongoingMatchNumber})`
        : `Trận #${nextOnCourt.match_number} chưa đủ người rảnh`
    if (pipelineQueue && queueHasRoom) {
      return {
        kind: "queue",
        teamA: pipelineQueue.teamA,
        teamB: pipelineQueue.teamB,
        label: pipelineQueue.label,
        reason: `${pipelineQueue.reason}. ${pending.length} trận chờ (${queueOrder}) — ${waitDetail}.`,
      }
    }
    return {
      kind: "wait_players",
      match: nextOnCourt,
      label: formatMatchLabel(nextOnCourt),
      reason: `${pending.length} trận chờ (${queueOrder}). ${waitDetail} — còn ${freeCourts} sân (${ongoing.length}/${maxCourts}).`,
    }
  }

  if (!idealCreate && !pipelineQueue) return null

  if (!canStartMore) {
    if (pipelineQueue) {
      return {
        kind: "queue",
        teamA: pipelineQueue.teamA,
        teamB: pipelineQueue.teamB,
        label: pipelineQueue.label,
        reason: `${pipelineQueue.reason}. Sân đầy (${ongoing.length}/${maxCourts}) — thêm vào hàng chờ.`,
      }
    }
    const fullNote = queueHasRoom
      ? ""
      : ` Hàng chờ đầy (${pending.length}/${maxCourts}).`
    return {
      kind: "wait_court",
      label: "Chờ sân trống",
      reason: `Sân đầy (${ongoing.length}/${maxCourts}) — kết thúc trận trên sân trước.${fullNote}`,
    }
  }

  if (idealCreate) {
    const { teamA, teamB } = idealCreate
    return {
      kind: "create",
      teamA,
      teamB,
      label: formatTeamsLabel(teamA, teamB, players),
      reason: fairnessReason(teamA, teamB, players, startFairness),
      altQueue: altQueueForPipeline(game, players, matches),
    }
  }

  if (pipelineQueue && canStartMore && !idealCreate) {
    return {
      kind: "queue",
      teamA: pipelineQueue.teamA,
      teamB: pipelineQueue.teamB,
      label: pipelineQueue.label,
      reason: `${pipelineQueue.reason} — thêm hàng chờ (chưa đủ người rảnh để bắt đầu ngay).`,
    }
  }

  if (pipelineQueue) {
    return {
      kind: "queue",
      teamA: pipelineQueue.teamA,
      teamB: pipelineQueue.teamB,
      label: pipelineQueue.label,
      reason: pipelineQueue.reason,
    }
  }

  return null
}
