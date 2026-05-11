"use client"

import { Home, Map, User, Compass, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type AppTab = "home" | "map" | "matches" | "my_games" | "profile"

interface BottomNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const navItems: Array<{ id: AppTab; icon: typeof Home; label: string }> = [
  { id: "home", icon: Home, label: "Trang chủ" },
  { id: "map", icon: Map, label: "Bản đồ" },
  { id: "matches", icon: Compass, label: "Tìm trận" },
  { id: "my_games", icon: CalendarCheck, label: "Của tôi" },
  { id: "profile", icon: User, label: "Cá nhân" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden">
      <div className="glass-dark border-t border-border/20 px-2 pt-2 pb-2">
        <nav className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
