"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Mapbox3DMap } from "./mapbox-3d-map"
import { SKILL_LABELS, type SkillLevel } from "./skill-badge"

const skillLevels = ["newbie", "beginner_plus", "lower_intermediate", "intermediate", "upper_intermediate", "advanced", "semi_pro", "professional"];
const priceRanges = [
  { id: "budget", label: "< 50K" },
  { id: "mid", label: "50K - 100K" },
  { id: "premium", label: "100K - 200K" },
  { id: "luxury", label: "> 200K" },
];
const hcmDistricts = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7",
  "Quận 8", "Quận 9", "Quận 10", "Quận 11", "Quận 12",
  "Quận Tân Bình", "Quận Tân Phú", "Quận Phú Nhuận", "Quận Bình Thạnh",
  "Quận Gò Vấp", "Quận Thủ Đức"
];

interface MapScreenProps {
  onOpenGame?: (id: number) => void
}

export function MapScreen({ onOpenGame }: MapScreenProps = {}) {
  const [filters, setFilters] = useState({
    skillLevels: [] as string[],
    priceRanges: [] as string[],
    districts: [] as string[],
  })

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }))
  }

  const activeFilterCount = Object.values(filters).flat().length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Khám phá</h1>

          {/* Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl relative">
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-4 sm:px-6">
              <SheetHeader className="pb-4 px-0">
                <SheetTitle className="text-left">Bộ lọc</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 pb-8 max-h-[70vh] overflow-y-auto">
                {/* Skill Level */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Trình độ</Label>
                  <div className="flex gap-2 flex-wrap">
                    {skillLevels.map((level) => (
                      <Badge
                        key={level}
                        variant={filters.skillLevels.includes(level) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2 rounded-full text-xs"
                        onClick={() => toggleFilter("skillLevels", level)}
                      >
                        {SKILL_LABELS[level as SkillLevel] || level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Giá tiền / 2 giờ</Label>
                  <div className="flex gap-2 flex-wrap">
                    {priceRanges.map((price) => (
                      <Badge
                        key={price.id}
                        variant={filters.priceRanges.includes(price.id) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2 rounded-full text-xs"
                        onClick={() => toggleFilter("priceRanges", price.id)}
                      >
                        {price.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* HCMC Districts */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Quận / Huyện TP HCM</Label>
                  <div className="flex gap-2 flex-wrap">
                    {hcmDistricts.map((district) => (
                      <Badge
                        key={district}
                        variant={filters.districts.includes(district) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1 rounded-full text-xs"
                        onClick={() => toggleFilter("districts", district)}
                      >
                        {district}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full rounded-full" size="lg">
                  Áp dụng bộ lọc
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[...filters.skillLevels, ...filters.priceRanges, ...filters.districts].map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
              >
                {SKILL_LABELS[filter as SkillLevel] || filter}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    if (filters.skillLevels.includes(filter)) toggleFilter("skillLevels", filter)
                    else if (filters.priceRanges.includes(filter)) toggleFilter("priceRanges", filter)
                    else toggleFilter("districts", filter)
                  }}
                />
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Map View */}
      <div className="flex-1 relative bg-black">
        <Mapbox3DMap onOpenGame={onOpenGame} />
      </div>
    </div>
  )
}
