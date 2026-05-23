"use client"

import { useState, useEffect, useCallback } from "react"
import { createGame, fetchVenues, createVenue, type Game, type Venue } from "@/lib/api"
import { skillLevels, timeSlots } from "./constants"
import type { SkillLevel } from "../skill-badge"
import { generateCreateMatchFbPost } from "./generate-fb-post"
import { forwardGeocode } from "@/lib/geocode"

export interface UseCreateMatchFormOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (game: Game) => void
  initialVenue?: Venue | null
}

export function useCreateMatchForm({ open, onOpenChange, onSuccess, initialVenue }: UseCreateMatchFormOptions) {
  const [step, setStep] = useState(1)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedCourts, setSelectedCourts] = useState<number[]>([])
  const [showVenuePicker, setShowVenuePicker] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date()
    if (now.getHours() >= 22) now.setDate(now.getDate() + 1)
    return now
  })
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [duration, setDuration] = useState(2)
  const [matchType, setMatchType] = useState<"singles" | "doubles">("doubles")
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [selectedLevels, setSelectedLevels] = useState<SkillLevel[]>(["newbie", "beginner_plus"])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [venueSearch, setVenueSearch] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdGame, setCreatedGame] = useState<Game | null>(null)
  const [copiedPost, setCopiedPost] = useState(false)

  const [venues, setVenues] = useState<Venue[]>([])
  const [venuesLoading, setVenuesLoading] = useState(false)
  const [showAddVenue, setShowAddVenue] = useState(false)
  const [newVenueName, setNewVenueName] = useState("")
  const [newVenueAddress, setNewVenueAddress] = useState("")
  const [newVenueCity, setNewVenueCity] = useState("HCM")
  const [addingVenue, setAddingVenue] = useState(false)
  const [detectedCity, setDetectedCity] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (detectedCity !== null) return
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude } = pos.coords
        const city = latitude > 15 ? "HN" : "HCM"
        setDetectedCity(city)
        setNewVenueCity(city)
      },
      () => {
        setDetectedCity("")
      },
      { timeout: 5000, maximumAge: 300000 },
    )
  }, [open, detectedCity])

  const loadVenues = useCallback((q?: string) => {
    setVenuesLoading(true)
    const city = detectedCity || undefined
    fetchVenues({ q, city })
      .then((res) => setVenues(res.venues))
      .catch(() => {})
      .finally(() => setVenuesLoading(false))
  }, [detectedCity])

  useEffect(() => {
    if (open) loadVenues()
  }, [open, loadVenues])

  useEffect(() => {
    if (!open || !initialVenue) return

    setSelectedVenue(initialVenue)
    setSelectedCourts([])
    setShowVenuePicker(false)
    setStep(1)
    setCreatedGame(null)
    setError(null)
    setVenues((prev) =>
      prev.some((v) => v.id === initialVenue.id) ? prev : [initialVenue, ...prev],
    )
    if (initialVenue.city) setDetectedCity(initialVenue.city)
  }, [open, initialVenue])

  useEffect(() => {
    if (!venueSearch) return
    const t = setTimeout(() => loadVenues(venueSearch), 300)
    return () => clearTimeout(t)
  }, [venueSearch, loadVenues])

  const handleAddVenue = async () => {
    if (!newVenueName.trim()) return
    setAddingVenue(true)
    try {
      const geocodeQuery = newVenueAddress.trim()
        ? `${newVenueName.trim()}, ${newVenueAddress.trim()}`
        : `${newVenueName.trim()}, ${newVenueCity === "HCM" ? "Hồ Chí Minh" : "Hà Nội"}`
      const coords = await forwardGeocode(geocodeQuery)

      const res = await createVenue({
        name: newVenueName.trim(),
        address: newVenueAddress.trim() || undefined,
        city: newVenueCity,
        lat: coords?.lat,
        lng: coords?.lng,
      })
      setVenues((prev) => [res.venue, ...prev])
      selectVenue(res.venue)
      setShowAddVenue(false)
      setNewVenueName("")
      setNewVenueAddress("")
    } catch {
      // silent
    } finally {
      setAddingVenue(false)
    }
  }

  const getAvailableTimeSlots = useCallback((date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString()
    if (!isToday) return timeSlots
    const nowHour = new Date().getHours()
    return timeSlots.filter((time) => {
      const [h] = time.split(":").map(Number)
      return h > nowHour
    })
  }, [])

  useEffect(() => {
    const available = getAvailableTimeSlots(selectedDate)
    if (selectedTime && !available.includes(selectedTime)) {
      setSelectedTime("")
    }
  }, [selectedDate, selectedTime, getAvailableTimeSlots])

  const filteredVenues = venues

  const toggleLevel = (level: SkillLevel) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleCourt = (court: number) => {
    setSelectedCourts((prev) =>
      prev.includes(court)
        ? prev.filter((c) => c !== court)
        : [...prev, court].sort((a, b) => a - b),
    )
  }

  const selectVenue = (venue: Venue) => {
    setSelectedVenue((current) => {
      if (current?.id !== venue.id) setSelectedCourts([])
      return venue
    })
    setShowVenuePicker(false)
  }

  const fbPostFor = (game: Game) =>
    generateCreateMatchFbPost(game, {
      venueName: selectedVenue?.name,
      venueAddress: selectedVenue?.address ?? undefined,
      courts: selectedCourts,
      levels: selectedLevels,
    })

  const handleSubmit = async () => {
    if (!selectedVenue || selectedCourts.length === 0 || !selectedTime) return
    setSubmitting(true)
    setError(null)

    const startDate = new Date(selectedDate)
    const [h, m] = selectedTime.split(":").map(Number)
    startDate.setHours(h, m, 0, 0)

    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000)

    const indices = selectedLevels.map(l => skillLevels.indexOf(l)).filter(i => i >= 0)
    const minTier = indices.length > 0 ? skillLevels[Math.min(...indices)] : undefined
    const maxTier = indices.length > 0 ? skillLevels[Math.max(...indices)] : undefined

    const safeMin = Math.max(0, Math.floor(minPrice || 0))
    const safeMax = Math.max(safeMin, Math.floor(maxPrice || safeMin))

    try {
      const game = await createGame({
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        venue_id: selectedVenue.id,
        lat: selectedVenue.lat ?? undefined,
        lng: selectedVenue.lng ?? undefined,
        match_type: matchType,
        min_tier: minTier,
        max_tier: maxTier,
        max_players: maxPlayers,
        courts: selectedCourts,
        title: title.trim() || undefined,
        description: description || undefined,
        min_price: safeMin,
        max_price: safeMax,
      })
      setCreatedGame(game)
      onSuccess?.(game)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (step === 2 && !selectedTime) return
    if (step < 3) setStep(step + 1)
    else handleSubmit()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else onOpenChange(false)
  }

  const resetAndClose = () => {
    setStep(1)
    setSelectedVenue(null)
    setSelectedCourts([])
    setShowVenuePicker(true)
    setMatchType("doubles")
    setMaxPlayers(8)
    setSelectedLevels(["newbie", "beginner_plus"])
    setSelectedTime("")
    setTitle("")
    setDescription("")
    setMinPrice(0)
    setMaxPrice(0)
    setError(null)
    setCreatedGame(null)
    setCopiedPost(false)
    onOpenChange(false)
  }

  const startOffset = new Date().getHours() >= 22 ? 1 : 0
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + startOffset + i)
    return date
  })

  const getDayName = (date: Date) => {
    if (date.toDateString() === new Date().toDateString()) return "Hôm nay"
    if (date.toDateString() === new Date(Date.now() + 86400000).toDateString()) return "Ngày mai"
    return date.toLocaleDateString("vi-VN", { weekday: "short" })
  }

  return {
    open,
    step, setStep,
    selectedVenue, setSelectedVenue, selectedCourts, setSelectedCourts,
    showVenuePicker, setShowVenuePicker,
    selectedDate, setSelectedDate, selectedTime, setSelectedTime,
    duration, setDuration, matchType, setMatchType, maxPlayers, setMaxPlayers,
    selectedLevels, setSelectedLevels, title, setTitle, description, setDescription,
    minPrice, setMinPrice, maxPrice, setMaxPrice, venueSearch, setVenueSearch,
    submitting, error, createdGame, copiedPost, setCopiedPost,
    venues, venuesLoading, showAddVenue, setShowAddVenue,
    newVenueName, setNewVenueName, newVenueAddress, setNewVenueAddress,
    newVenueCity, setNewVenueCity, addingVenue, detectedCity, setDetectedCity,
    filteredVenues, toggleLevel, toggleCourt, selectVenue,
    handleAddVenue, fbPostFor, handleNext, handleBack, resetAndClose, dates, getDayName,
    getAvailableTimeSlots,
  }
}
