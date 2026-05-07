"use client"

import { Bell, Search, MapPin, Users, Clock, ChevronRight, Flame, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SkillBadge } from "./skill-badge"

interface HomeScreenProps {
  onCreateMatch: () => void
}

const upcomingMatches = [
  {
    id: 1,
    venue: "Nhà thi đấu Phú Thọ",
    address: "Quận 11, TP.HCM",
    time: "18:00 - 20:00",
    date: "Hôm nay",
    players: 6,
    maxPlayers: 8,
    level: "Khá",
    surface: "Gỗ",
    hasAC: true,
    isHot: true,
  },
  {
    id: 2,
    venue: "CLB Cầu Lông Tân Bình",
    address: "Quận Tân Bình, TP.HCM",
    time: "19:30 - 21:30",
    date: "Ngày mai",
    players: 4,
    maxPlayers: 6,
    level: "Trung bình +",
    surface: "Cao su",
    hasAC: false,
    isHot: false,
  },
]

const nearbyVenues = [
  {
    id: 1,
    name: "Galaxy Badminton",
    distance: "1.2 km",
    courts: 8,
    rating: 4.8,
    image: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 2,
    name: "Victory Sports",
    distance: "2.5 km",
    courts: 12,
    rating: 4.6,
    image: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 3,
    name: "Pro Badminton Center",
    distance: "3.1 km",
    courts: 6,
    rating: 4.9,
    image: "/placeholder.svg?height=100&width=150",
  },
]

export function HomeScreen({ onCreateMatch }: HomeScreenProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 ring-2 ring-primary/30">
              <AvatarImage src="/placeholder.svg?height=44&width=44" alt="User" />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">TH</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Xin chào,</p>
              <h1 className="font-bold text-foreground">Tuấn Hưng</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* User Stats Card */}
      <div className="px-4 pt-4">
        <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SkillBadge level="Khá" size="sm" />
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px] px-2 py-0">
                  <Zap className="w-3 h-3 mr-1" />
                  +45 GR
                </Badge>
              </div>
              <p className="text-3xl font-bold text-foreground mt-2">2,480</p>
              <p className="text-xs text-muted-foreground">Global Rating</p>
            </div>
            <div className="text-right">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">Thắng</span>
                  <span className="font-bold text-emerald-400">78%</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">Trận</span>
                  <span className="font-bold text-foreground">156</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">Hạng</span>
                  <span className="font-bold text-primary">#247</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onCreateMatch}
            className="h-auto py-4 rounded-2xl bg-primary hover:bg-primary/90 flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-semibold">Tạo trận đấu</span>
          </Button>
          <Button 
            variant="secondary"
            className="h-auto py-4 rounded-2xl bg-secondary hover:bg-secondary/80 flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Đặt sân</span>
          </Button>
        </div>
      </div>

      {/* Upcoming Matches */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Trận đấu sắp tới</h2>
          <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingMatches.map((match) => (
            <Card 
              key={match.id} 
              className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{match.venue}</h3>
                    {match.isHot && (
                      <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0">
                        <Flame className="w-3 h-3 mr-0.5" />
                        HOT
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {match.address}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{match.date}</span>
                      <span className="font-medium">{match.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <SkillBadge level={match.level} size="xs" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {match.surface}
                    </Badge>
                    {match.hasAC && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/30">
                        AC
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 bg-secondary rounded-full px-2 py-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {match.players}/{match.maxPlayers}
                    </span>
                  </div>
                  <Button size="sm" className="rounded-full text-xs h-8 px-4">
                    Tham gia
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Nearby Venues */}
      <section className="px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Sân gần bạn</h2>
          <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {nearbyVenues.map((venue) => (
            <Card 
              key={venue.id}
              className="flex-shrink-0 w-40 rounded-2xl overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-3xl">🏸</div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{venue.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{venue.distance}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-xs">★</span>
                    <span className="text-xs font-medium">{venue.rating}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{venue.courts} sân</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
