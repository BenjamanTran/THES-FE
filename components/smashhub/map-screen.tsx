"use client"

import { useEffect, useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Mapbox3DMap, type MapGameStatusFilter } from "./mapbox-3d-map"

export type CityKey = "HCM" | "HN"

const CITY_LABELS: Record<CityKey, string> = { HCM: "TP.HCM", HN: "Hà Nội" }

const STATUS_OPTIONS: { id: MapGameStatusFilter; label: string; description: string }[] = [
  { id: "all", label: "Tất cả", description: "Mọi trận chưa kết thúc" },
  { id: "open", label: "Đang mở", description: "Chỉ trận đang nhận người" },
  { id: "not_full", label: "Còn chỗ", description: "Trận chưa đủ người" },
]

const STATUS_LABEL: Record<MapGameStatusFilter, string> = {
  all: "Tất cả",
  open: "Đang mở",
  not_full: "Còn chỗ",
}

interface MapScreenProps {
  onOpenGame?: (id: number) => void
}

export function MapScreen({ onOpenGame }: MapScreenProps = {}) {
  const [selectedCity, setSelectedCity] = useState<CityKey>("HCM")
  const [cityDetected, setCityDetected] = useState(false)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<MapGameStatusFilter>("all")
  const [draftStatusFilter, setDraftStatusFilter] = useState<MapGameStatusFilter>("all")
  const [filterOpen, setFilterOpen] = useState(false)

  const filtersActive = appliedStatusFilter !== "all"

  useEffect(() => {
    if (cityDetected) return
    if (!navigator.geolocation) {
      setCityDetected(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedCity(pos.coords.latitude > 15 ? "HN" : "HCM")
        setCityDetected(true)
      },
      () => setCityDetected(true),
      { timeout: 5000, maximumAge: 300000 },
    )
  }, [cityDetected])

  const applyFilters = () => {
    setAppliedStatusFilter(draftStatusFilter)
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setDraftStatusFilter("all")
    setAppliedStatusFilter("all")
    setFilterOpen(false)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <header className="glass-dark shrink-0 z-40 px-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Tìm trận</h1>
            <div className="flex gap-1 ml-2">
              {(["HCM", "HN"] as CityKey[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    selectedCity === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/60 border-border/40 text-muted-foreground",
                  )}
                >
                  {CITY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <Sheet
            open={filterOpen}
            onOpenChange={(open) => {
              if (open) setDraftStatusFilter(appliedStatusFilter)
              setFilterOpen(open)
            }}
          >
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl relative">
                <Filter className="w-4 h-4" />
                {filtersActive && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-4 sm:px-6">
              <SheetHeader className="pb-4 px-0">
                <SheetTitle className="text-left">Bộ lọc</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 pb-8">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Trạng thái trận</Label>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = draftStatusFilter === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDraftStatusFilter(opt.id)}
                          className={cn(
                            "w-full text-left rounded-xl border px-3 py-2.5 transition-colors",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-secondary/30 hover:bg-secondary/50",
                          )}
                        >
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {opt.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  {draftStatusFilter !== "all" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={() => setDraftStatusFilter("all")}
                    >
                      Đặt lại
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="flex-1 rounded-full"
                    size="lg"
                    onClick={applyFilters}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {filtersActive && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
            >
              {STATUS_LABEL[appliedStatusFilter]}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
        <Mapbox3DMap
          city={selectedCity}
          statusFilter={appliedStatusFilter}
          onOpenGame={onOpenGame}
        />
      </div>
    </div>
  )
}
