"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchGamesSearch, type Game } from "@/lib/api"
import { useGeolocation } from "@/hooks/use-geolocation"
import { ALL_FILTERS, PER_PAGE, type Filters } from "./constants"

export function useMatchesScreen() {
  const geo = useGeolocation(false)
  const [filters, setFilters] = useState<Filters>(ALL_FILTERS)
  const [draftFilters, setDraftFilters] = useState<Filters>(ALL_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationActive = filters.useLocation && geo.status === "granted" && geo.coords !== null

  const buildParams = useCallback(
    (pageNum: number): Record<string, string> => {
      const params: Record<string, string> = {
        time_scope: "discover",
        sort: "discover",
        per_page: String(PER_PAGE),
        page: String(pageNum),
      }
      if (filters.notFull) params.not_full = "true"
      if (filters.tier) params.tier = filters.tier
      if (filters.matchType !== "any") params.match_type = filters.matchType
      if (filters.priceMax > 0) params.price_max = String(filters.priceMax)
      if (locationActive && geo.coords) {
        params.lat = String(geo.coords.lat)
        params.lng = String(geo.coords.lng)
        params.radius = String(filters.radiusKm)
      }
      return params
    },
    [filters, locationActive, geo.coords],
  )

  const loadFirstPage = useCallback(() => {
    setLoading(true)
    setError(null)
    setPage(1)
    fetchGamesSearch(buildParams(1))
      .then((res) => {
        setGames(res.games)
        setHasMore(res.meta?.has_more ?? false)
        setTotal(res.meta?.total ?? null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không tải được")
        setGames([])
        setHasMore(false)
        setTotal(null)
      })
      .finally(() => setLoading(false))
  }, [buildParams])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return
    const next = page + 1
    setLoadingMore(true)
    fetchGamesSearch(buildParams(next))
      .then((res) => {
        setGames((prev) => {
          const seen = new Set(prev.map((g) => g.id))
          const fresh = res.games.filter((g) => !seen.has(g.id))
          return [...prev, ...fresh]
        })
        setHasMore(res.meta?.has_more ?? false)
        setPage(next)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được"))
      .finally(() => setLoadingMore(false))
  }, [buildParams, hasMore, loading, loadingMore, page])

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.tier) n += 1
    if (filters.matchType !== "any") n += 1
    if (filters.notFull) n += 1
    if (filters.useLocation) n += 1
    if (filters.priceMax > 0) n += 1
    return n
  }, [filters])

  const applyDraft = () => {
    setFilters(draftFilters)
    setFilterOpen(false)
    if (draftFilters.useLocation && geo.status !== "granted") {
      geo.request()
    }
  }

  const resetDraft = () => setDraftFilters(ALL_FILTERS)

  const clearAllFilters = () => {
    setFilters(ALL_FILTERS)
    setDraftFilters(ALL_FILTERS)
    setFilterOpen(false)
  }

  const removeFilter = (key: keyof Filters) => {
    setFilters((f) => ({ ...f, [key]: ALL_FILTERS[key] }))
  }

  const locationStatusText = (() => {
    if (activeFilterCount === 0) return "Trận đang diễn ra · đã kết thúc ở cuối"
    if (!filters.useLocation) return "Đã áp dụng bộ lọc"
    switch (geo.status) {
      case "granted":
        return `Trong bán kính ${filters.radiusKm} km`
      case "prompt":
        return "Đang xin quyền truy cập vị trí…"
      case "denied":
        return "Bạn từ chối quyền truy cập vị trí · đang hiển thị tất cả"
      case "unsupported":
        return "Trình duyệt không hỗ trợ định vị"
      case "error":
        return "Không xác định được vị trí"
      default:
        return "Chưa lấy vị trí"
    }
  })()

  return {
    geo,
    filters,
    setFilters,
    draftFilters,
    setDraftFilters,
    filterOpen,
    setFilterOpen,
    games,
    page,
    hasMore,
    total,
    loading,
    loadingMore,
    error,
    locationActive,
    activeFilterCount,
    applyDraft,
    resetDraft,
    clearAllFilters,
    removeFilter,
    locationStatusText,
    loadFirstPage,
    loadMore,
  }
}
