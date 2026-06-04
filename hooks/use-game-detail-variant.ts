"use client"

import { useEffect, useState } from "react"
import {
  fetchExperiments,
  getCachedExperiments,
  setCachedExperiments,
  type GameDetailScreenVariant,
} from "@/lib/api"

function forceVariantFromEnv(): GameDetailScreenVariant | null {
  const v = process.env.NEXT_PUBLIC_GAME_DETAIL_FORCE?.trim()
  if (v === "legacy" || v === "simple") return v
  return null
}

function forceVariantFromQuery(): GameDetailScreenVariant | null {
  if (typeof window === "undefined") return null
  const v = new URLSearchParams(window.location.search).get("game_detail")?.trim()
  if (v === "legacy" || v === "simple") return v
  return null
}

export function useGameDetailVariant(enabled: boolean) {
  const [variant, setVariant] = useState<GameDetailScreenVariant | null>(() => {
    return forceVariantFromEnv() ?? forceVariantFromQuery()
  })
  const [loading, setLoading] = useState(enabled && variant === null)

  useEffect(() => {
    if (!enabled) return

    const forced = forceVariantFromEnv() ?? forceVariantFromQuery()
    if (forced) {
      setVariant(forced)
      setLoading(false)
      return
    }

    const cached = getCachedExperiments()?.game_detail_screen
    if (cached) {
      setVariant(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetchExperiments()
      .then((res) => {
        if (cancelled) return
        setCachedExperiments(res.experiments)
        setVariant(res.experiments.game_detail_screen)
      })
      .catch(() => {
        if (cancelled) return
        setVariant("simple")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return {
    variant: variant ?? "simple",
    loading: enabled && loading,
  }
}
