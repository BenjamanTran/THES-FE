export type DoublesGenderMode = "any" | "mens" | "mixed" | "womens"

export type FairnessLevel = "good" | "moderate" | "poor"

export interface FairnessResult {
  avgA: number
  avgB: number
  diff: number
  level: FairnessLevel
}

export interface BalanceResult {
  teamA: number[]
  teamB: number[]
}

/** @deprecated Always balanced-first; kept for API compatibility */
export type BalanceTier = 0 | 1

export interface ScoredOption {
  result: BalanceResult
  mcSum: number
  diff: number
}

export interface LineupSkillGapInfo {
  showWarning: boolean
  tierSpread: number
  ratingSpread: number
  minTier: string | null
  maxTier: string | null
}
