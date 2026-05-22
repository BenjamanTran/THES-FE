"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Achievement } from "@/lib/api"

function pickHighlighted(achievements: Achievement[]): Achievement[] {
  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)
  const near = locked
    .filter((a) => a.progress && a.progress.target > 0)
    .sort((a, b) => {
      const ra = (a.progress!.current / a.progress!.target)
      const rb = (b.progress!.current / b.progress!.target)
      return rb - ra
    })

  const picked = [...unlocked.slice(-4), ...near.slice(0, 4)]
  const seen = new Set<string>()
  const unique: Achievement[] = []
  for (const a of [...picked, ...achievements]) {
    if (seen.has(a.id)) continue
    seen.add(a.id)
    unique.push(a)
    if (unique.length >= 8) break
  }
  return unique
}

export function ProfileAchievementsSection({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null

  const highlighted = pickHighlighted(achievements)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          Thành tích
          <span className="text-xs font-normal text-muted-foreground ml-2">
            {unlockedCount}/{achievements.length}
          </span>
        </h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold" disabled>
          Xem tất cả
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {highlighted.map((achievement) => (
          <div
            key={achievement.id}
            title={
              achievement.progress && !achievement.unlocked
                ? `${achievement.progress.current}/${achievement.progress.target}`
                : achievement.name
            }
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
  )
}
