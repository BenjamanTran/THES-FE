import type { SkillLevel } from "../skill-badge"

export const skillLevels: SkillLevel[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
]

export const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
]

export const COURT_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1)

export function formatCourtList(courts: number[]) {
  if (!courts.length) return "Chưa chọn sân"
  return courts.map((c) => `Sân ${c}`).join(", ")
}
