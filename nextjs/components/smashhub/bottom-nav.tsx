"use client"

import { Home, Map, Trophy, User, Plus, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
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

export function BottomNav({ activeTab, onTabChange, onCreateMatch }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden">
      <div className="glass-dark border-t border-border/20 px-2 pt-2 pb-2">
        <nav className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            // Insert FAB in the middle
            if (index === 2) {
              return (
                <div key="create-fab" className="flex items-center gap-1">
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                    <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                  </button>
                  
                  {/* Floating Action Button */}
                  <button
                    onClick={onCreateMatch}
                    className="relative -top-4 bg-primary text-primary-foreground rounded-full p-4 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-200"
                    aria-label="Tạo trận đấu mới"
                  >
                    <Plus className="w-6 h-6 stroke-[2.5px]" />
                  </button>
                </div>
              )
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
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
