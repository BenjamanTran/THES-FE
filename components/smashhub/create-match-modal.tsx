"use client"

import { useState, useEffect, useCallback } from "react"
import { X, MapPin, Calendar, Clock, Users, Shuffle, ChevronRight, Check, Minus, Plus, Search, Swords, Loader2, FileText, Wallet, PlusCircle, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { SkillBadge, SKILL_LABELS, type SkillLevel } from "./skill-badge"
import { createGame, fetchVenues, createVenue, type Game, type Venue } from "@/lib/api"
import { formatPriceRange } from "@/lib/format"
import { forwardGeocode } from "@/lib/geocode"

interface CreateMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (game: Game) => void
}

const skillLevels: SkillLevel[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
]

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
]

export function CreateMatchModal({ open, onOpenChange, onSuccess }: CreateMatchModalProps) {
  const [step, setStep] = useState(1)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [courtCount, setCourtCount] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date()
    if (now.getHours() >= 22) now.setDate(now.getDate() + 1)
    return now
  })
  const [selectedTime, setSelectedTime] = useState<string>("18:00")
  const [duration, setDuration] = useState(2)
  const [matchType, setMatchType] = useState<"singles" | "doubles">("doubles")
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [selectedLevels, setSelectedLevels] = useState<SkillLevel[]>(["newbie", "beginner_plus"])
  const [shuffleMode, setShuffleMode] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [venueSearch, setVenueSearch] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setSelectedVenue(res.venue)
      setShowAddVenue(false)
      setNewVenueName("")
      setNewVenueAddress("")
    } catch {
      // silent
    } finally {
      setAddingVenue(false)
    }
  }

  const filteredVenues = venues

  const toggleLevel = (level: SkillLevel) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const handleSubmit = async () => {
    if (!selectedVenue) return
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
        courts: Array.from({ length: courtCount }, (_, i) => i + 1),
        title: title.trim() || undefined,
        description: description || undefined,
        min_price: safeMin,
        max_price: safeMax,
      })
      resetAndClose()
      onSuccess?.(game)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
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
    setCourtCount(1)
    setMatchType("doubles")
    setMaxPlayers(8)
    setSelectedLevels(["newbie", "beginner_plus"])
    setTitle("")
    setDescription("")
    setMinPrice(0)
    setMaxPrice(0)
    setError(null)
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

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent showCloseButton={false} className="max-w-md mx-auto h-[85dvh] flex flex-col p-0 gap-0 rounded-t-3xl">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Tạo trận đấu</DialogTitle>
            <DialogDescription className="sr-only">
              Thiết lập địa điểm, thời gian và thể thức để tạo trận đấu mới.
            </DialogDescription>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={resetAndClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={cn(
                  "w-full h-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-secondary"
                )} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span className={step >= 1 ? "text-primary" : ""}>Địa điểm</span>
            <span className={step >= 2 ? "text-primary" : ""}>Thời gian</span>
            <span className={step >= 3 ? "text-primary" : ""}>Chi tiết</span>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {/* Step 1: Venue Selection */}
          {step === 1 && (
            <div className="space-y-4">
              {/* City toggle + Search */}
              <div className="flex items-center gap-2">
                {["HCM", "HN", ""].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setDetectedCity(c); setVenueSearch("") }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border transition-colors flex-shrink-0",
                      detectedCity === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border/40"
                    )}
                  >
                    {c === "HCM" ? "TP.HCM" : c === "HN" ? "Hà Nội" : "Tất cả"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm sân..."
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>

              {/* Venue List */}
              {venuesLoading && venues.length === 0 ? (
                <div className="space-y-2 animate-skeleton">
                  <div className="h-20 rounded-2xl bg-muted/30" />
                  <div className="h-20 rounded-2xl bg-muted/30" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredVenues.map((venue) => (
                    <Card
                      key={venue.id}
                      className={cn(
                        "p-4 rounded-2xl cursor-pointer transition-all",
                        selectedVenue?.id === venue.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border/50 hover:border-primary/30"
                      )}
                      onClick={() => setSelectedVenue(venue)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">{venue.name}</h3>
                            {venue.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                          {venue.address && <p className="text-xs text-muted-foreground mt-1">{venue.address}</p>}
                        </div>
                        {selectedVenue?.id === venue.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {filteredVenues.length === 0 && !venuesLoading && (
                    <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy sân nào</p>
                  )}
                </div>
              )}

              {/* Add new venue */}
              {!showAddVenue ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-dashed"
                  onClick={() => setShowAddVenue(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Thêm sân mới
                </Button>
              ) : (
                <Card className="p-4 rounded-2xl border-primary/30 space-y-3">
                  <p className="text-sm font-semibold">Thêm sân mới</p>
                  <Input
                    placeholder="Tên sân *"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Địa chỉ (VD: 123 Nguyễn Văn Cừ, Q.5)"
                    value={newVenueAddress}
                    onChange={(e) => setNewVenueAddress(e.target.value)}
                    className="rounded-xl"
                  />
                  <div className="flex gap-2">
                    {["HCM", "HN"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewVenueCity(c)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition-colors",
                          newVenueCity === c
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border/40"
                        )}
                      >
                        {c === "HCM" ? "TP.HCM" : "Hà Nội"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => setShowAddVenue(false)}
                    >
                      Huỷ
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={handleAddVenue}
                      disabled={!newVenueName.trim() || addingVenue}
                    >
                      {addingVenue && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Thêm
                    </Button>
                  </div>
                </Card>
              )}

              {/* Court count */}
              {selectedVenue && (
                <div className="pt-4 border-t border-border/20">
                  <Label className="text-sm font-semibold mb-3 block">Số sân đặt</Label>
                  <div className="flex items-center justify-between bg-secondary rounded-2xl p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-10 h-10"
                      onClick={() => setCourtCount(Math.max(1, courtCount - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold">{courtCount} sân</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-10 h-10"
                      onClick={() => setCourtCount(courtCount + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Chọn ngày
                </Label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  {dates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex-shrink-0 w-16 p-3 rounded-2xl text-center transition-all",
                        selectedDate.toDateString() === date.toDateString()
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      <p className="text-[10px] mb-1">{getDayName(date)}</p>
                      <p className="text-lg font-bold">{date.getDate()}</p>
                      <p className="text-[10px]">{date.toLocaleDateString("vi-VN", { month: "short" })}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Giờ bắt đầu
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots
                    .filter((time) => {
                      if (selectedDate.toDateString() !== new Date().toDateString()) return true
                      const [h] = time.split(":").map(Number)
                      return h > new Date().getHours()
                    })
                    .map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Thời lượng</Label>
                <div className="flex items-center justify-between bg-secondary rounded-2xl p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setDuration(Math.max(0.5, duration - 0.5))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold">{duration} giờ</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setDuration(duration + 0.5)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Match Details */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Match Type */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  Loại trận
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={matchType === "singles" ? "default" : "outline"}
                    className="rounded-xl h-14 flex-col gap-1"
                    onClick={() => setMatchType("singles")}
                  >
                    <span className="text-base">🏸</span>
                    <span className="text-xs">Đơn (1v1)</span>
                  </Button>
                  <Button
                    variant={matchType === "doubles" ? "default" : "outline"}
                    className="rounded-xl h-14 flex-col gap-1"
                    onClick={() => setMatchType("doubles")}
                  >
                    <span className="text-base">🏸🏸</span>
                    <span className="text-xs">Đôi (2v2)</span>
                  </Button>
                </div>
              </div>

              {/* Max Players */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Số người chơi tối đa
                </Label>
                <div className="flex items-center justify-between bg-secondary rounded-2xl p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold">{maxPlayers} người</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setMaxPlayers(maxPlayers + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Price per slot */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Giá / slot
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (cho toàn bộ {duration} giờ)
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Tối thiểu</p>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={10000}
                        value={minPrice || ""}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0
                          setMinPrice(v)
                          if (maxPrice && v > maxPrice) setMaxPrice(v)
                        }}
                        placeholder="0"
                        className="rounded-xl pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">đ</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Tối đa</p>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={10000}
                        value={maxPrice || ""}
                        onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="rounded-xl pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">đ</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { label: "Miễn phí", min: 0, max: 0 },
                    { label: "~50K", min: 30000, max: 50000 },
                    { label: "~80K", min: 50000, max: 80000 },
                    { label: "~120K", min: 80000, max: 120000 },
                    { label: "~200K", min: 150000, max: 200000 },
                  ].map((preset) => {
                    const active = minPrice === preset.min && maxPrice === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setMinPrice(preset.min)
                          setMaxPrice(preset.max)
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs border transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary border-border/40 hover:border-primary/30",
                        )}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
                {(minPrice > 0 || maxPrice > 0) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Hiển thị cho người tham gia: {formatPriceRange(minPrice, maxPrice)}
                  </p>
                )}
              </div>

              {/* Skill Levels */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Trình độ chấp nhận</Label>
                <div className="flex flex-wrap gap-2">
                  {skillLevels.map((level) => (
                    <div
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className="cursor-pointer"
                    >
                      <SkillBadge 
                        level={level} 
                        size="sm"
                        showIcon={false}
                      />
                      {selectedLevels.includes(level) && (
                        <div className="w-full h-0.5 bg-primary mt-1 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
                {selectedLevels.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Đã chọn: {selectedLevels.map(l => SKILL_LABELS[l]).join(", ")}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tên trận đấu
                  <span className="text-xs font-normal text-muted-foreground">(tuỳ chọn)</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="VD: Giao lưu thứ 7 hàng tuần"
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả
                </Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Giao lưu vui vẻ, mang vợt riêng, có nước uống..."
                  maxLength={200}
                  className="w-full rounded-xl bg-secondary border-0 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  rows={3}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{description.length}/200</p>
              </div>

              {/* Shuffle Mode */}
              <Card className="p-4 rounded-2xl border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shuffle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Shuffle Mode</p>
                      <p className="text-xs text-muted-foreground">Xáo trộn đội tự động bằng AI</p>
                    </div>
                  </div>
                  <Switch
                    checked={shuffleMode}
                    onCheckedChange={setShuffleMode}
                  />
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
                <h4 className="font-semibold mb-3">Tóm tắt</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Địa điểm</span>
                    <span className="font-medium">{selectedVenue?.name || "Chưa chọn"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sân</span>
                    <span className="font-medium">{courtCount} sân</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày</span>
                    <span className="font-medium">
                      {selectedDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giờ</span>
                    <span className="font-medium">{selectedTime} - {
                      (() => {
                        const [h, m] = selectedTime.split(":").map(Number)
                        const endH = h + duration
                        return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                      })()
                    }</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loại trận</span>
                    <span className="font-medium">{matchType === "singles" ? "Đơn (1v1)" : "Đôi (2v2)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số người</span>
                    <span className="font-medium">{maxPlayers} người</span>
                  </div>
                  {selectedLevels.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trình độ</span>
                      <span className="font-medium">{selectedLevels.map(l => SKILL_LABELS[l]).join(", ")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá / slot</span>
                    <span className="font-medium">
                      {minPrice > 0 || maxPrice > 0 ? formatPriceRange(minPrice, maxPrice) : "Chưa đặt"}
                    </span>
                  </div>
                </div>
              </Card>

              {error && (
                <Card className="p-3 rounded-2xl bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border/20 flex-shrink-0 safe-bottom">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={handleBack}
            >
              {step === 1 ? "Hủy" : "Quay lại"}
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={handleNext}
              disabled={(step === 1 && !selectedVenue) || submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {submitting ? "Đang tạo..." : step === 3 ? "Tạo trận đấu" : "Tiếp theo"}
              {!submitting && step < 3 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
