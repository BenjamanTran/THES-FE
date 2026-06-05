"use client"

import { useEffect, useState } from "react"
import { fetchGameSettlement } from "@/lib/api/settlement"

export function useSettlementStatus(gameId: number | null, enabled: boolean) {
  const [statusLabel, setStatusLabel] = useState("Chưa tính")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!gameId || !enabled) return
    let cancelled = false
    fetchGameSettlement(gameId)
      .then((res) => {
        if (cancelled) return
        if (res.settlement?.status === "published") {
          setStatusLabel("Đã công bố")
        } else if (res.settlement?.status === "draft" && res.can_manage) {
          setStatusLabel("Nháp")
        } else {
          setStatusLabel("Chưa tính")
        }
      })
      .catch(() => {
        if (!cancelled) setStatusLabel("Chưa tính")
      })
    return () => {
      cancelled = true
    }
  }, [gameId, enabled, tick])

  return { statusLabel, refreshStatus: () => setTick((t) => t + 1) }
}
