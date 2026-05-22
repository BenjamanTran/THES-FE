import type { Gender } from "@/lib/api"

export const GENDER_LABEL: Record<Gender, string> = {
  unspecified: "Chưa cập nhật",
  male: "Nam",
  female: "Nữ",
  other: "Khác",
} as const
