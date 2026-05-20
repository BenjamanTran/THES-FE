import { request } from "./client"
import type { Venue } from "./types"

export function fetchVenues(params?: { city?: string; q?: string }) {
  const qs = new URLSearchParams()
  if (params?.city) qs.set("city", params.city)
  if (params?.q) qs.set("q", params.q)
  const query = qs.toString()
  return request<{ venues: Venue[] }>(`/api/v1/venues${query ? `?${query}` : ""}`)
}

export function fetchSuggestedVenues() {
  return request<{ venues: Venue[] }>("/api/v1/venues?suggested=1")
}

export function createVenue(params: {
  name: string
  address?: string
  city?: string
  district?: string
  lat?: number
  lng?: number
}) {
  return request<{ venue: Venue }>("/api/v1/venues", {
    method: "POST",
    body: JSON.stringify(params),
  })
}
