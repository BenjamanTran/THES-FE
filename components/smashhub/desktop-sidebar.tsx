"use client"

import { Home, Map, Trophy, User, Plus, Calendar, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DesktopSidebarProps {
  activeTab: "home" | "map" | "matches" | "ranking" | "profile"
  onTabChange: (tab: "home" | "map" | "matches" | "ranking" | "profile") => void
  onCreateMatch: () => void
}

const navItems = [
  { id: "home" as const, icon: Home, label: "Trang chủ" },
  { id: "map" as const, icon: Map, label: "Bản đồ" },
  { id: "matches" as const, icon: Calendar, label: "Trận đấu" },
  { id: "ranking" as const, icon: Trophy, label: "Bảng xếp hạng" },
  { id: "profile" as const, icon: User, label: "Cá nhân" },
]

export function DesktopSidebar({ activeTab, onTabChange, onCreateMatch }: DesktopSidebarProps) {
  return (
    <div className="w-64 bg-neutral-900/50 backdrop-blur-xl border-r border-neutral-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-xl">🏸</span>
          </div>
          <div>
            <h1 className="font-bold text-foreground">SmashHub</h1>
            <p className="text-xs text-primary">Pro Edition</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/50">
          <Avatar className="w-10 h-10 ring-2 ring-primary/30">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">TH</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">Tuấn Hưng</p>
            <p className="text-xs text-muted-foreground">GR: 2,480</p>
          </div>
          <div className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium">
            Khá
          </div>
        </div>
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
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-neutral-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-neutral-800/50 transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Cài đặt</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
