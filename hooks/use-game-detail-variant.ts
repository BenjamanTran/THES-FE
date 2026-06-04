"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  fetchExperiments,
  getCachedExperiments,
  setCachedExperiments,
  type GameDetailScreenVariant,
} from "@/lib/api"

function forceVariantFromQuery(searchParams: URLSearchParams): GameDetailScreenVariant | null {
  const raw =
    searchParams.get("game_detail") ??
    searchParams.get("game_detail_screen") ??
    searchParams.get("gd")
  if (raw === "legacy" || raw === "simple") return raw
  return null
}

export function useGameDetailVariant(enabled: boolean) {
  const searchParams = useSearchParams()
  const forced = forceVariantFromQuery(searchParams)
  const cached = getCachedExperiments()?.game_detail_screen

  const [variant, setVariant] = useState<GameDetailScreenVariant>(
    forced ?? cached ?? "legacy",
  )
  const [loading, setLoading] = useState(enabled && forced == null && cached == null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const fromQuery = forceVariantFromQuery(searchParams)
    if (fromQuery) {
      setVariant(fromQuery)
      setLoading(false)
      return
    }

    const existing = getCachedExperiments()?.game_detail_screen
    if (existing) {
      setVariant(existing)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchExperiments()
      .then((res) => {
        if (cancelled) return
        setCachedExperiments(res.experiments)
        setVariant(res.experiments.game_detail_screen)
      })
      .catch(() => {
        if (cancelled) return
        setVariant("legacy")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, searchParams])

  return {
    variant: forced ?? variant,
    loading: forced != null ? false : loading,
  }
}
