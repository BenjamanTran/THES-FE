"use client"

import { useState } from "react"
import { Filter, List, MapPin, Snowflake, Car, ShowerHead, Store, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SkillBadge } from "./skill-badge"

interface MapMarker {
  id: number
  type: "match" | "venue"
  name: string
  lat: number
  lng: number
  players?: number
  maxPlayers?: number
  level?: string
  time?: string
  courts?: number
  rating?: number
}

const markers: MapMarker[] = [
  { id: 1, type: "match", name: "Trận đấu tại Phú Thọ", lat: 10.77, lng: 106.66, players: 6, maxPlayers: 8, level: "Khá", time: "18:00" },
  { id: 2, type: "match", name: "Friendly Match", lat: 10.78, lng: 106.68, players: 4, maxPlayers: 6, level: "Trung bình +", time: "19:30" },
  { id: 3, type: "venue", name: "Galaxy Badminton", lat: 10.76, lng: 106.67, courts: 8, rating: 4.8 },
  { id: 4, type: "venue", name: "Victory Sports", lat: 10.79, lng: 106.65, courts: 12, rating: 4.6 },
  { id: 5, type: "match", name: "Pro Training", lat: 10.75, lng: 106.69, players: 2, maxPlayers: 4, level: "Bán chuyên", time: "20:00" },
]

const filterOptions = {
  environment: ["Indoor", "Outdoor"],
  surface: ["Gỗ", "Cao su", "Synthetic"],
  amenities: [
    { id: "ac", label: "Điều hòa", icon: Snowflake },
    { id: "parking", label: "Bãi đỗ xe", icon: Car },
    { id: "shower", label: "Phòng tắm", icon: ShowerHead },
    { id: "shop", label: "Pro Shop", icon: Store },
  ],
}

export function MapScreen() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [filters, setFilters] = useState({
    environment: [] as string[],
    surface: [] as string[],
    amenities: [] as string[],
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
                
                <div className="space-y-6 pb-8">
                  {/* Environment */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Môi trường</Label>
                    <div className="flex gap-2">
                      {filterOptions.environment.map((env) => (
                        <Badge
                          key={env}
                          variant={filters.environment.includes(env) ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 rounded-full"
                          onClick={() => toggleFilter("environment", env)}
                        >
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Surface */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Mặt sân</Label>
                    <div className="flex gap-2 flex-wrap">
                      {filterOptions.surface.map((surface) => (
                        <Badge
                          key={surface}
                          variant={filters.surface.includes(surface) ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 rounded-full"
                          onClick={() => toggleFilter("surface", surface)}
                        >
                          {surface}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Tiện ích</Label>
                    <div className="space-y-3">
                      {filterOptions.amenities.map((amenity) => {
                        const Icon = amenity.icon
                        return (
                          <div key={amenity.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{amenity.label}</span>
                            </div>
                            <Switch
                              checked={filters.amenities.includes(amenity.id)}
                              onCheckedChange={() => toggleFilter("amenities", amenity.id)}
                            />
                          </div>
                        )
                      })}
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
            {[...filters.environment, ...filters.surface, ...filters.amenities].map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
              >
                {filter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  if (filters.environment.includes(filter)) toggleFilter("environment", filter)
                  else if (filters.surface.includes(filter)) toggleFilter("surface", filter)
                  else toggleFilter("amenities", filter)
                }} />
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Map View */}
      {viewMode === "map" ? (
        <div className="flex-1 relative bg-accent/50">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent/30 to-accent/50">
            {/* Grid pattern to simulate map */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* Map Markers */}
          <div className="absolute inset-0 p-8">
            {markers.map((marker, index) => (
              <button
                key={marker.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                  selectedMarker?.id === marker.id ? "scale-125 z-20" : "z-10 hover:scale-110"
                }`}
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${15 + (index * 20) % 50}%`,
                }}
                onClick={() => setSelectedMarker(marker)}
              >
                {marker.type === "match" ? (
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                      selectedMarker?.id === marker.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card text-foreground border-2 border-primary"
                    }`}>
                      <span className="text-lg">🏸</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {marker.players}
                    </div>
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    selectedMarker?.id === marker.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card text-foreground border border-border"
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Selected Marker Info */}
          {selectedMarker && (
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <Card className="p-4 rounded-2xl border-primary/30 bg-card/95 backdrop-blur-sm">
                <button 
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary"
                  onClick={() => setSelectedMarker(null)}
                >
                  <X className="w-4 h-4" />
                </button>
                
                {selectedMarker.type === "match" ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{selectedMarker.name}</h3>
                      <SkillBadge level={selectedMarker.level || "Khá"} size="xs" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedMarker.time} • {selectedMarker.players}/{selectedMarker.maxPlayers} người chơi
                    </p>
                    <Button className="w-full rounded-full">Tham gia ngay</Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-1">{selectedMarker.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <span>{selectedMarker.courts} sân</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {selectedMarker.rating}
                      </span>
                    </div>
                    <Button className="w-full rounded-full">Đặt sân</Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Recenter Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full shadow-lg z-20"
          >
            <MapPin className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {markers.map((marker) => (
              <Card 
                key={marker.id}
                className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                {marker.type === "match" ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🏸</span>
                        <h3 className="font-semibold text-sm">{marker.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{marker.time}</p>
                      <SkillBadge level={marker.level || "Khá"} size="xs" />
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="rounded-full mb-2">
                        {marker.players}/{marker.maxPlayers}
                      </Badge>
                      <Button size="sm" className="rounded-full text-xs">Tham gia</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">{marker.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {marker.courts} sân • ★ {marker.rating}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full text-xs">Đặt sân</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
