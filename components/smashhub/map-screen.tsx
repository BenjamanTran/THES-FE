"use client"

import { useState } from "react"
import { Filter, List, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Mapbox3DMap } from "./mapbox-3d-map"
import { fetchGames, type Game } from "@/lib/api"
import { format } from "date-fns"
import { useEffect } from "react"

const skillLevels = ["Newbie", "Yếu +", "Trung bình yếu", "Trung bình trừ", "Trung bình", "Trung bình khá", "Bán chuyên", "Chuyên nghiệp"];
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

export function MapScreen() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")

  useEffect(() => {
    if (viewMode !== "list") return
    setLoading(true)
    fetchGames({ status: "open", per_page: "20" })
      .then((res) => setGames(res.games))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [viewMode])
  const [filters, setFilters] = useState({
    skillLevels: [] as string[],
    priceRanges: [] as string[],
    districts: [] as string[],
  })

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }))
  }

  const activeFilterCount = Object.values(filters).flat().length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Khám phá</h1>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")}>
              <TabsList className="h-9 bg-secondary/50">
                <TabsTrigger value="map" className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="list" className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <List className="w-4 h-4 mr-1" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

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
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader className="pb-4">
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
                          {level}
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
                {filter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  if (filters.skillLevels.includes(filter)) toggleFilter("skillLevels", filter)
                  else if (filters.priceRanges.includes(filter)) toggleFilter("priceRanges", filter)
                  else toggleFilter("districts", filter)
                }} />
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Map View */}
      {viewMode === "map" ? (
        <div className="flex-1 relative bg-black">
          <Mapbox3DMap />
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Đang tải...</p>
          ) : games.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Chưa có trận đấu nào</p>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🏸</span>
                        <h3 className="font-semibold text-sm">
                          {game.match_type === 'singles' ? 'Đơn' : 'Đôi'} • {game.location || 'Chưa rõ'}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(game.start_time), 'HH:mm dd/MM')}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {game.players_count}/{game.max_players}
                      </Badge>
                      {game.status === 'open' && (
                        <Button size="sm" className="rounded-full text-xs">Tham gia</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
