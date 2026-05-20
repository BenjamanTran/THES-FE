export const userStatsMock = {
  avatar: "/placeholder.svg?height=100&width=100",
  level: "advanced",
  gr: 2480,
  grChange: "+45",
  rank: 247,
  winRate: 78,
  totalMatches: 156,
  wins: 122,
  losses: 34,
  streak: 5,
  memberSince: "Tháng 3, 2024",
  favoriteVenue: "Nhà thi đấu Phú Thọ",
  playTime: "256 giờ",
}

export const recentActivity = [
  { type: "match", title: "Thắng vs Minh Đức", gr: "+15", time: "Hôm qua" },
  { type: "match", title: "Thắng vs Hoàng Long", gr: "+12", time: "2 ngày trước" },
  { type: "achievement", title: "Chuỗi 5 trận thắng", badge: "🔥", time: "2 ngày trước" },
  { type: "match", title: "Thua vs Văn Nam", gr: "-8", time: "3 ngày trước" },
  { type: "level", title: "Lên cấp: Khá", badge: "⚡", time: "1 tuần trước" },
]

export const achievements = [
  { id: 1, name: "Người mới", icon: "🌱", unlocked: true },
  { id: 2, name: "50 trận", icon: "🏸", unlocked: true },
  { id: 3, name: "100 trận", icon: "🎯", unlocked: true },
  { id: 4, name: "Chuỗi 5", icon: "🔥", unlocked: true },
  { id: 5, name: "Chuỗi 10", icon: "💎", unlocked: false },
  { id: 6, name: "Top 100", icon: "👑", unlocked: false },
]

import type { Gender } from "@/lib/api"

export const GENDER_LABEL: Record<Gender, string> = {
  unspecified: "Chưa cập nhật",
  male: "Nam",
  female: "Nữ",
  other: "Khác",
} as const
