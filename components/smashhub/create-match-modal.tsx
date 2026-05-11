"use client"

import { useState } from "react"
import { MapPin, Calendar, Clock, Users, Shuffle, ChevronRight, Check, Minus, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { SkillBadge, type SkillLevel } from "./skill-badge"

interface CreateMatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const skillLevels: SkillLevel[] = [
  "Newbie",
  "Yếu",
  "Yếu +",
  "Trung bình yếu",
  "Trung bình -",
  "Trung bình +",
  "Khá",
  "Bán chuyên",
  "Chuyên nghiệp",
]

const venues = [
  { id: 1, name: "Nhà thi đấu Phú Thọ", address: "Quận 11, TP.HCM", courts: 12 },
  { id: 2, name: "CLB Cầu Lông Tân Bình", address: "Quận Tân Bình, TP.HCM", courts: 8 },
  { id: 3, name: "Galaxy Badminton", address: "Quận 7, TP.HCM", courts: 8 },
  { id: 4, name: "Victory Sports", address: "Quận Bình Thạnh, TP.HCM", courts: 12 },
  { id: 5, name: "Pro Badminton Center", address: "Quận 1, TP.HCM", courts: 6 },
]

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
]

export function CreateMatchModal({ open, onOpenChange }: CreateMatchModalProps) {
  const [step, setStep] = useState(1)
  const [selectedVenue, setSelectedVenue] = useState<typeof venues[0] | null>(null)
  const [selectedCourts, setSelectedCourts] = useState<number[]>([1])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("18:00")
  const [duration, setDuration] = useState(2)
  const [playerRange, setPlayerRange] = useState({ min: 6, max: 8 })
  const [selectedLevels, setSelectedLevels] = useState<SkillLevel[]>(["Khá", "Bán chuyên"])
  const [shuffleMode, setShuffleMode] = useState(false)
  const [venueSearch, setVenueSearch] = useState("")

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    v.address.toLowerCase().includes(venueSearch.toLowerCase())
  )

  const toggleLevel = (level: SkillLevel) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleCourt = (court: number) => {
    setSelectedCourts(prev => 
      prev.includes(court)
        ? prev.filter(c => c !== court)
        : [...prev, court].sort((a, b) => a - b)
    )
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else {
      // Submit logic here
      onOpenChange(false)
      setStep(1)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else onOpenChange(false)
  }

  const resetAndClose = () => {
    setStep(1)
    setSelectedVenue(null)
    setSelectedCourts([1])
    setSelectedLevels(["Khá", "Bán chuyên"])
    onOpenChange(false)
  }

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  const getDayName = (date: Date) => {
    if (date.toDateString() === new Date().toDateString()) return "Hôm nay"
    if (date.toDateString() === new Date(Date.now() + 86400000).toDateString()) return "Ngày mai"
    return date.toLocaleDateString("vi-VN", { weekday: "short" })
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md mx-auto h-[85dvh] flex flex-col p-0 gap-0 rounded-t-3xl">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/20 flex-shrink-0">
          <DialogTitle className="text-lg font-bold">Tạo trận đấu</DialogTitle>
          
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
        <ScrollArea className="flex-1 px-4 py-4">
          {/* Step 1: Venue Selection */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Search */}
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
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{venue.address}</p>
                        <p className="text-xs text-muted-foreground">{venue.courts} sân</p>
                      </div>
                      {selectedVenue?.id === venue.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Court Selection */}
              {selectedVenue && (
                <div className="pt-4 border-t border-border/20">
                  <Label className="text-sm font-semibold mb-3 block">Chọn sân</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: selectedVenue.courts }, (_, i) => i + 1).map((court) => (
                      <Button
                        key={court}
                        variant={selectedCourts.includes(court) ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl"
                        onClick={() => toggleCourt(court)}
                      >
                        Sân {court}
                      </Button>
                    ))}
                  </div>
                  {selectedCourts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Đã chọn: {selectedCourts.map(c => `Sân ${c}`).join(", ")}
                    </p>
                  )}
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
                  {timeSlots.map((time) => (
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
                    onClick={() => setDuration(Math.max(1, duration - 0.5))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold">{duration} giờ</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10"
                    onClick={() => setDuration(Math.min(4, duration + 0.5))}
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
              {/* Player Count */}
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Số người chơi
                </Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tối thiểu</p>
                    <div className="flex items-center justify-between bg-secondary rounded-2xl p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setPlayerRange(prev => ({ ...prev, min: Math.max(2, prev.min - 1) }))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-lg font-bold">{playerRange.min}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setPlayerRange(prev => ({ ...prev, min: Math.min(prev.max, prev.min + 1) }))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tối đa</p>
                    <div className="flex items-center justify-between bg-secondary rounded-2xl p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setPlayerRange(prev => ({ ...prev, max: Math.max(prev.min, prev.max - 1) }))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-lg font-bold">{playerRange.max}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => setPlayerRange(prev => ({ ...prev, max: Math.min(12, prev.max + 1) }))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
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
                    Đã chọn: {selectedLevels.join(", ")}
                  </p>
                )}
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
                    <span className="font-medium">{selectedCourts.map(c => `Sân ${c}`).join(", ")}</span>
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
                    <span className="text-muted-foreground">Số người</span>
                    <span className="font-medium">{playerRange.min} - {playerRange.max} người</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </ScrollArea>

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
              disabled={step === 1 && !selectedVenue}
            >
              {step === 3 ? "Tạo trận đấu" : "Tiếp theo"}
              {step < 3 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
