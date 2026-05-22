"use client"

import { Card } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/format-relative-time"
import type { RecentActivityItem } from "@/lib/api"

function grLabel(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

function activityIcon(item: RecentActivityItem): string {
  if (item.type === "match_win" || item.type === "match_loss") return "🏸"
  if (item.type === "achievement") return item.badge ?? "🏆"
  return "📍"
}

function iconBg(item: RecentActivityItem): string {
  if (item.type === "match_win") return "bg-emerald-500/20"
  if (item.type === "match_loss") return "bg-red-500/20"
  return "bg-primary/20"
}

export function ActivityList({ activities }: { activities: RecentActivityItem[] }) {
  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <Card
          key={`${activity.type}-${activity.occurred_at}-${index}`}
          className="p-3 rounded-2xl border-border/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg(activity)}`}
            >
              <span className="text-lg">{activityIcon(activity)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              {activity.subtitle && (
                <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.occurred_at)}</p>
            </div>
            {activity.gr_delta != null && (
              <span
                className={`font-bold shrink-0 ${
                  activity.gr_delta > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {grLabel(activity.gr_delta)}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
