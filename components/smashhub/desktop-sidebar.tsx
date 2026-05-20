"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Map, User, Plus, Compass, CalendarCheck, Settings, LogOut, LogIn, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./user-avatar"
import type { AppTab } from "./bottom-nav"
import { useAuth } from "@/lib/auth-context"

interface DesktopSidebarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  onCreateMatch: () => void
}

const navItems: Array<{ id: AppTab; icon: typeof Home; label: string }> = [
  { id: "home", icon: Home, label: "Trang chủ" },
  { id: "map", icon: Map, label: "Bản đồ" },
  { id: "matches", icon: Compass, label: "Tìm trận" },
  { id: "my_games", icon: CalendarCheck, label: "Của tôi" },
  { id: "profile", icon: User, label: "Cá nhân" },
]

export function DesktopSidebar({ activeTab, onTabChange, onCreateMatch }: DesktopSidebarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex flex-col text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="SmashHub" className="w-10 h-10 rounded-2xl" />
          <div>
            <h1 className="font-bold text-foreground">SmashHub</h1>
            <p className="text-xs text-primary">Pro Edition</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        {user ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatar_url}
              className="w-10 h-10 ring-2 ring-primary/30"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login?next=/")}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent hover:bg-muted transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
              <LogIn className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">Đăng nhập</p>
              <p className="text-xs text-muted-foreground truncate">Để tạo & tham gia trận</p>
            </div>
          </button>
        )}
      </div>

      {/* Create Match Button */}
      <div className="p-4">
        <button
          onClick={onCreateMatch}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Tạo trận đấu
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Cài đặt</span>
        </button>
        {user ? (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            <span className="font-medium">Đăng xuất</span>
          </button>
        ) : (
          <button
            onClick={() => router.push("/signup")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Tạo tài khoản</span>
          </button>
        )}
      </div>
    </div>
  )
}
