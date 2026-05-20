import { TIER_LABELS } from "./constants"

export function tierLabel(tier: string | null): string {
  if (!tier) return "—"
  return TIER_LABELS[tier] || tier
}

export function radiusFromZoom(zoom: number): number {
  if (zoom >= 16) return 8
  if (zoom >= 14) return 15
  if (zoom >= 12) return 25
  if (zoom >= 10) return 40
  return 50
}

export function groupKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

export interface GameGroup {
  key: string
  lat: number
  lng: number
  games: import("@/lib/api").Game[]
}
