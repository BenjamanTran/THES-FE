"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, ChevronRight, Trophy, Target, Flame, TrendingUp, Calendar, Clock, Edit2, LogOut, Loader2, LogIn, UserPlus, Phone, User as UserIcon, Award, Star, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SkillBadge } from "./skill-badge"
import { useAuth } from "@/lib/auth-context"
import { EditProfileSheet } from "./edit-profile-sheet"
import { MockSection } from "./mock-section"
import type { Gender } from "@/lib/api"
import { ratingToStars } from "@/lib/rating-stars"
import { resendVerificationEmail, upgradeGuest } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldAlert } from "lucide-react"

const GENDER_LABEL: Record<Gender, string> = {
  unspecified: "Chưa cập nhật",
  male: "Nam",
  female: "Nữ",
  other: "Khác",
}

const userStatsMock = {
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

function avatarFallback(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1] || name
  return last.charAt(0).toUpperCase()
}

function ProfileRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-8 h-8 rounded-full bg-secondary/60 text-muted-foreground flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={"text-sm font-medium truncate " + (muted ? "text-muted-foreground" : "")}>
          {value}
        </p>
      </div>
    </li>
  )
}

export function ProfileScreen() {
  const router = useRouter()
  const { user, logout, refresh } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState("")
  const [upgradePassword, setUpgradePassword] = useState("")
  const [upgradeConfirm, setUpgradeConfirm] = useState("")
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const [resendingVerify, setResendingVerify] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)

  const handleResendVerification = async () => {
    setVerifyMessage(null)
    setResendingVerify(true)
    try {
      const res = await resendVerificationEmail()
      setVerifyMessage(res.message)
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Gửi email thất bại")
    } finally {
      setResendingVerify(false)
    }
  }

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (upgradePassword !== upgradeConfirm) {
      setUpgradeError("Mật khẩu xác nhận không khớp")
      return
    }
    setUpgradeError(null)
    setUpgrading(true)
    try {
      await upgradeGuest({
        email: upgradeEmail.trim(),
        password: upgradePassword,
        password_confirmation: upgradeConfirm,
      })
      await refresh()
      setShowUpgradeForm(false)
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Nâng cấp thất bại")
    } finally {
      setUpgrading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col">
        <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
          <h1 className="text-xl font-bold">Hồ sơ</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center text-4xl mb-4">
            🏸
          </div>
          <h2 className="text-lg font-bold mb-2">Chào mừng tới SmashHub</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">
            Đăng nhập để tạo trận, tham gia trận khác và theo dõi lịch sử của bạn.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <Button className="w-full rounded-full" onClick={() => router.push("/login")}>
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => router.push("/signup")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tạo tài khoản mới
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-8">
            Bạn vẫn có thể xem trận trên các tab khác mà không cần đăng nhập.
          </p>
        </div>
      </div>
    )
  }

  const userStats = { ...userStatsMock, name: user.name, email: user.email }
  const declaredRank = user.declared_rank ?? user.rank
  const matchStats = user.rank
  const apiStats = user.stats

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Hồ sơ</h1>
          <Button variant="ghost" size="icon" className="rounded-full" disabled>
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
                  {avatarFallback(userStats.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md"
                onClick={() => setEditOpen(true)}
                aria-label="Chỉnh sửa hồ sơ"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1 truncate">{userStats.name}</h2>
              {userStats.email && (
                <p className="text-xs text-muted-foreground mb-2 truncate">{userStats.email}</p>
              )}
              {declaredRank ? (
                <>
                  <SkillBadge level={declaredRank.tier} size="sm" />
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[11px] text-muted-foreground">{declaredRank.display_name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= ratingToStars(declaredRank.tier, declaredRank.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Chưa khai báo trình độ
                </p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full mt-2 -ml-2 h-7 px-3 text-xs text-primary"
                onClick={() => setEditOpen(true)}
              >
                <Edit2 className="w-3 h-3 mr-1.5" />
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </div>
        </div>

        {/* Email verification */}
        {!user.guest && user.email && user.email_verified === false && (
          <div className="px-4 pb-4">
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400 mb-0.5">Email chưa xác minh</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Tài khoản chưa xác minh email sẽ bị xóa sau 30 ngày. Vui lòng kiểm tra hộp thư và
                    nhấn link xác minh.
                  </p>
                  {verifyMessage && (
                    <p className="text-xs text-muted-foreground mb-2">{verifyMessage}</p>
                  )}
                  <Button
                    size="sm"
                    className="rounded-full text-xs h-7"
                    onClick={handleResendVerification}
                    disabled={resendingVerify}
                  >
                    {resendingVerify && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                    Gửi email xác minh
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Personal info */}
        <div className="px-4 pb-4">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
              <h3 className="text-sm font-semibold">Thông tin cá nhân</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-primary text-xs"
                onClick={() => setEditOpen(true)}
              >
                Sửa
              </Button>
            </div>
            <ul className="divide-y divide-border/40">
              <ProfileRow
                icon={<UserIcon className="w-4 h-4" />}
                label="Giới tính"
                value={GENDER_LABEL[user.gender] || GENDER_LABEL.unspecified}
              />
              <ProfileRow
                icon={<Award className="w-4 h-4" />}
                label="Trình độ"
                value={declaredRank?.display_name || "Chưa khai báo"}
                muted={!declaredRank}
              />
              <ProfileRow
                icon={<Phone className="w-4 h-4" />}
                label="Số điện thoại"
                value={user.phone || "Chưa cập nhật"}
                muted={!user.phone}
              />
            </ul>
          </Card>
        </div>

        {/* Guest upgrade banner */}
        {user.guest && (
          <div className="px-4 pb-4">
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400 mb-0.5">Tài khoản khách</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Đặt email & mật khẩu để bảo vệ tài khoản và đăng nhập lại sau.
                  </p>
                  {!showUpgradeForm ? (
                    <Button
                      size="sm"
                      className="rounded-full text-xs h-7"
                      onClick={() => setShowUpgradeForm(true)}
                    >
                      Nâng cấp tài khoản
                    </Button>
                  ) : (
                    <form onSubmit={handleUpgrade} className="space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-email" className="text-xs">Email</Label>
                        <Input
                          id="upgrade-email"
                          type="email"
                          required
                          value={upgradeEmail}
                          onChange={(e) => setUpgradeEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-pass" className="text-xs">Mật khẩu</Label>
                        <Input
                          id="upgrade-pass"
                          type="password"
                          required
                          minLength={8}
                          value={upgradePassword}
                          onChange={(e) => setUpgradePassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-confirm" className="text-xs">Xác nhận mật khẩu</Label>
                        <Input
                          id="upgrade-confirm"
                          type="password"
                          required
                          minLength={8}
                          value={upgradeConfirm}
                          onChange={(e) => setUpgradeConfirm(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      {upgradeError && (
                        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                          {upgradeError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs flex-1"
                          onClick={() => setShowUpgradeForm(false)}
                          disabled={upgrading}
                        >
                          Huỷ
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="rounded-full text-xs flex-1"
                          disabled={upgrading}
                        >
                          {upgrading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          Lưu
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Declared skill card */}
        <div className="px-4 pb-4">
          <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex items-start justify-between mb-4 relative z-10 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Trình độ khai báo</p>
                {declaredRank ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <SkillBadge level={declaredRank.tier} size="sm" />
                    </div>
                    <p className="text-2xl font-bold truncate">{declaredRank.display_name}</p>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= ratingToStars(declaredRank.tier, declaredRank.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa khai báo trình độ</p>
                )}
              </div>
              {declaredRank && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground mb-1">Điểm khai báo</p>
                  <p className="text-2xl font-bold text-primary">
                    {declaredRank.rating.toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-10">
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <p className="text-lg font-bold">{apiStats?.win_rate ?? 0}%</p>
                <p className="text-[10px] text-muted-foreground">Tỷ lệ thắng</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold">{matchStats?.matches_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Tổng trận</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">
                  {apiStats?.global_rank != null ? `#${apiStats.global_rank}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Hạng GR</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Win/Loss Progress */}
        <div className="px-4 pb-4">
          <MockSection>
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
          </MockSection>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-4">
          <MockSection>
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
          </MockSection>
        </div>

        {/* Achievements */}
        <div className="px-4 pb-4">
          <MockSection>
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
          </MockSection>
        </div>

        {/* Logout */}
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Đăng xuất
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="px-4 pb-8">
          <MockSection>
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
          </MockSection>
        </div>
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
