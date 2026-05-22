"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { RecentActivityItem } from "@/lib/api"
import { ActivityList } from "./activity-list"
import { ProfileActivityAllSheet } from "./profile-activity-all-sheet"

export function ProfileActivitySection({ activities }: { activities: RecentActivityItem[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <div className="px-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Hoạt động gần đây</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs font-semibold"
            disabled={activities.length === 0}
            onClick={() => setSheetOpen(true)}
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {activities.length === 0 ? (
          <Card className="p-4 rounded-2xl border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              Chưa có hoạt động — tham gia buổi chơi để bắt đầu
            </p>
          </Card>
        ) : (
          <ActivityList activities={activities} />
        )}
      </div>

      <ProfileActivityAllSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
