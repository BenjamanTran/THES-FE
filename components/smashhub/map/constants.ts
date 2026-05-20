export const TIER_LABELS: Record<string, string> = {
  newbie: "Newbie",
  beginner_plus: "Yếu +",
  lower_intermediate: "Trung bình yếu",
  intermediate: "Trung bình -",
  upper_intermediate: "Trung bình +",
  advanced: "Khá",
  semi_pro: "Bán chuyên",
  professional: "Chuyên nghiệp",
}

export type MapGameStatusFilter = "all" | "open" | "not_full"

export const HCM_CENTER: [number, number] = [106.6601, 10.7626]
export const HN_CENTER: [number, number] = [105.8342, 21.0278]
export const CITY_CENTERS: Record<string, [number, number]> = { HCM: HCM_CENTER, HN: HN_CENTER }
