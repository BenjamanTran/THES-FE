import type { SkillRadarAxisKey, SkillScores, Tier } from "@/lib/api"

export const SKILL_RADAR_AXES: Array<{
  key: SkillRadarAxisKey
  label: string
  shortLabel: string
}> = [
  { key: "attack", label: "Tấn công", shortLabel: "Tấn công" },
  { key: "defense", label: "Phòng thủ", shortLabel: "Phòng thủ" },
  { key: "technique", label: "Kỹ thuật", shortLabel: "Kỹ thuật" },
  { key: "agility", label: "Nhanh nhẹn", shortLabel: "Nhanh" },
  { key: "footwork", label: "Bộ pháp", shortLabel: "Bộ pháp" },
  { key: "stamina", label: "Thể lực", shortLabel: "Thể lực" },
]

export const DEFAULT_SKILL_SCORES: SkillScores = {
  attack: 5,
  defense: 5,
  technique: 5,
  agility: 5,
  footwork: 5,
  stamina: 5,
}

export const TIER_RADAR_COLORS: Record<Tier, string> = {
  newbie: "#9ca3af",
  beginner_plus: "#22c55e",
  lower_intermediate: "#3b82f6",
  intermediate: "#2563eb",
  upper_intermediate: "#06b6d4",
  advanced: "#a855f7",
  semi_pro: "#f59e0b",
  professional: "#ff6b00",
}

export function scoresFromRadar(axes: Array<{ key: SkillRadarAxisKey; score: number }> | undefined): SkillScores {
  if (!axes?.length) return DEFAULT_SKILL_SCORES

  return axes.reduce<SkillScores>(
    (scores, axis) => ({
      ...scores,
      [axis.key]: axis.score,
    }),
    { ...DEFAULT_SKILL_SCORES },
  )
}

export function overallScoreFromScores(scores: SkillScores) {
  const total = SKILL_RADAR_AXES.reduce((sum, axis) => sum + scores[axis.key], 0)
  return Math.round((total / SKILL_RADAR_AXES.length) * 10) / 10
}

export function computedStarsFromScores(scores: SkillScores) {
  const stars = overallScoreFromScores(scores) / 2
  return Math.min(5, Math.max(0.5, Math.round(stars * 100) / 100))
}

export function radarColorForTier(tier: Tier | null | undefined) {
  return tier ? TIER_RADAR_COLORS[tier] : TIER_RADAR_COLORS.newbie
}
