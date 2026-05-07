"use client"

import { Settings, ChevronRight, Trophy, Target, Flame, TrendingUp, Calendar, Clock, Award, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "./skill-badge"
import { Progress } from "@/components/ui/progress"

const userStats = {
  name: "Tuấn Hưng",
  avatar: "/placeholder.svg?height=100&width=100",
  level: "Khá",
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

const recentActivity = [
  { type: "match", title: "Thắng vs Minh Đức", gr: "+15", time: "Hôm qua" },
  { type: "match", title: "Thắng vs Hoàng Long", gr: "+12", time: "2 ngày trước" },
  { type: "achievement", title: "Chuỗi 5 trận thắng", badge: "🔥", time: "2 ngày trước" },
  { type: "match", title: "Thua vs Văn Nam", gr: "-8", time: "3 ngày trước" },
  { type: "level", title: "Lên cấp: Khá", badge: "⚡", time: "1 tuần trước" },
]

const achievements = [
  { id: 1, name: "Người mới", icon: "🌱", unlocked: true },
  { id: 2, name: "50 trận", icon: "🏸", unlocked: true },
  { id: 3, name: "100 trận", icon: "🎯", unlocked: true },
  { id: 4, name: "Chuỗi 5", icon: "🔥", unlocked: true },
  { id: 5, name: "Chuỗi 10", icon: "💎", unlocked: false },
  { id: 6, name: "Top 100", icon: "👑", unlocked: false },
]

export function ProfileScreen() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Hồ sơ</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-primary/30">
                <AvatarImage src={userStats.avatar} alt={userStats.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {userStats.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{userStats.name}</h2>
              <SkillBadge level={userStats.level} size="sm" />
              <p className="text-xs text-muted-foreground mt-2">
                Thành viên từ {userStats.memberSince}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="px-4 pb-4">
          <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Global Rating</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{userStats.gr}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {userStats.grChange}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Xếp hạng</p>
                <p className="text-2xl font-bold text-primary">#{userStats.rank}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-10">
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <p className="text-lg font-bold">{userStats.winRate}%</p>
                <p className="text-[10px] text-muted-foreground">Tỷ lệ thắng</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold">{userStats.totalMatches}</p>
                <p className="text-[10px] text-muted-foreground">Tổng trận</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Flame className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{userStats.streak}</p>
                <p className="text-[10px] text-muted-foreground">Chuỗi thắng</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Win/Loss Progress */}
        <div className="px-4 pb-4">
          <Card className="p-4 rounded-2xl border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Thắng / Thua</span>
              <span className="text-xs text-muted-foreground">
                {userStats.wins}W - {userStats.losses}L
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-red-500/30">
              <div 
                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(userStats.wins / userStats.totalMatches) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-emerald-400">{userStats.wins} Thắng</span>
              <span className="text-xs text-red-400">{userStats.losses} Thua</span>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 rounded-2xl border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Thời gian chơi</p>
                  <p className="font-bold">{userStats.playTime}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-2xl border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sân yêu thích</p>
                  <p className="font-bold text-sm truncate max-w-[100px]">{userStats.favoriteVenue}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Achievements */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Thành tích</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
              Xem tất cả
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                  achievement.unlocked 
                    ? "bg-primary/10 border border-primary/30" 
                    : "bg-secondary/50 border border-border/30 opacity-50"
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <span className="text-[8px] mt-1 text-muted-foreground text-center px-1 truncate w-full">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Hoạt động gần đây</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
              Xem tất cả
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <Card 
                key={index}
                className="p-3 rounded-2xl border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "match" 
                      ? activity.gr?.startsWith("+") 
                        ? "bg-emerald-500/20" 
                        : "bg-red-500/20"
                      : "bg-primary/20"
                  }`}>
                    {activity.type === "match" ? (
                      <span className="text-lg">🏸</span>
                    ) : (
                      <span className="text-lg">{activity.badge}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.gr && (
                    <span className={`font-bold ${
                      activity.gr.startsWith("+") ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {activity.gr}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
