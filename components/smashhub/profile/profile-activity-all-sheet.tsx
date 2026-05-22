"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { fetchMyActivity } from "@/lib/api"
import type { RecentActivityItem } from "@/lib/api"
import { ActivityList } from "./activity-list"

const PAGE_SIZE = 20

interface ProfileActivityAllSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileActivityAllSheet({ open, onOpenChange }: ProfileActivityAllSheetProps) {
  const [activities, setActivities] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => {
    setActivities([])
    setError(null)
    setHasMore(false)
    setNextOffset(0)
  }, [])

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const res = await fetchMyActivity(offset, PAGE_SIZE)
      setActivities((prev) => (append ? [...prev, ...res.recent_activity] : res.recent_activity))
      setHasMore(res.has_more)
      setNextOffset(res.next_offset)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hoạt động")
      if (!append) setActivities([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      loadPage(0, false)
    }
  }, [open, reset, loadPage])

  useEffect(() => {
    if (!open || !hasMore || loading || loadingMore) return

    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          loadPage(nextOffset, true)
        }
      },
      { root, rootMargin: "80px", threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, hasMore, loading, loadingMore, nextOffset, loadPage])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Hoạt động gần đây</SheetTitle>
          <SheetDescription>Kéo xuống để tải thêm</SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 -mx-1 px-1">
          {loading && activities.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error && activities.length === 0 ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Chưa có hoạt động — tham gia buổi chơi để bắt đầu
            </p>
          ) : (
            <>
              <ActivityList activities={activities} />
              <div ref={sentinelRef} className="h-4" aria-hidden />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!hasMore && activities.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Đã hiển thị tất cả</p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
