import { useCallback, useEffect, useState } from "react"

export type GeoStatus = "idle" | "prompt" | "granted" | "denied" | "unsupported" | "error"

export interface GeoState {
  status: GeoStatus
  coords: { lat: number; lng: number } | null
  error: string | null
}

const initial: GeoState = { status: "idle", coords: null, error: null }

export function useGeolocation(autoRequest: boolean = true) {
  const [state, setState] = useState<GeoState>(initial)

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unsupported", coords: null, error: "Trình duyệt không hỗ trợ định vị" })
      return
    }
    setState((s) => ({ ...s, status: "prompt", error: null }))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        })
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED
        setState({
          status: denied ? "denied" : "error",
          coords: null,
          error: err.message,
        })
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  useEffect(() => {
    if (autoRequest) request()
  }, [autoRequest, request])

  return { ...state, request }
}
