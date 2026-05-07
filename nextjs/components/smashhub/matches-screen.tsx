"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Users, Filter, Plus, MessageCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkillBadge } from "./skill-badge"

interface MatchesScreenProps {
  onCreateMatch: () => void
}

const upcomingMatches = [
  {
    id: 1,
    venue: "Nhà thi đấu Phú Thọ",
    address: "Quận 11, TP.HCM",
    date: "Hôm nay",
    time: "18:00 - 20:00",
    players: [
      { id: 1, name: "Tuấn Hưng", avatar: "/placeholder.svg?height=32&width=32", level: "Khá" },
      { id: 2, name: "Minh Đức", avatar: "/placeholder.svg?height=32&width=32", level: "Khá" },
      { id: 3, name: "Hoàng Long", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình +" },
      { id: 4, name: "Văn Nam", avatar: "/placeholder.svg?height=32&width=32", level: "Khá" },
      { id: 5, name: "Đức Anh", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình +" },
      { id: 6, name: "Quốc Việt", avatar: "/placeholder.svg?height=32&width=32", level: "Bán chuyên" },
    ],
    maxPlayers: 8,
    levels: ["Khá", "Bán chuyên"],
    status: "confirmed",
    hasChat: true,
    isHost: true,
  },
  {
    id: 2,
    venue: "CLB Cầu Lông Tân Bình",
    address: "Quận Tân Bình, TP.HCM",
    date: "Ngày mai",
    time: "19:30 - 21:30",
    players: [
      { id: 1, name: "Phương Anh", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình +" },
      { id: 2, name: "Thanh Tùng", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình +" },
      { id: 3, name: "Mai Lan", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình -" },
      { id: 4, name: "Hải Đăng", avatar: "/placeholder.svg?height=32&width=32", level: "Trung bình +" },
    ],
    maxPlayers: 6,
    levels: ["Trung bình -", "Trung bình +"],
    status: "pending",
    hasChat: true,
    isHost: false,
  },
]

const pastMatches = [
  {
    id: 101,
    venue: "Galaxy Badminton",
    date: "Hôm qua",
    result: "Thắng",
    grChange: +15,
    opponent: "Minh Đức",
  },
  {
    id: 102,
    venue: "Victory Sports",
    date: "3 ngày trước",
    result: "Thua",
    grChange: -8,
    opponent: "Hoàng Long",
  },
  {
    id: 103,
    venue: "Pro Badminton Center",
    date: "1 tuần trước",
    result: "Thắng",
    grChange: +12,
    opponent: "Văn Nam",
  },
]

export function MatchesScreen({ onCreateMatch }: MatchesScreenProps) {
  const [activeTab, setActiveTab] = useState("upcoming")

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Trận đấu</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <Filter className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="rounded-xl h-9"
              onClick={onCreateMatch}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tạo mới
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger 
              value="upcoming" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sắp tới
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Đã chơi
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "upcoming" ? (
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <Card 
                key={match.id}
                className="p-4 rounded-2xl border-border/50 overflow-hidden"
              >
                {/* Match Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{match.venue}</h3>
                      {match.isHost && (
                        <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                          Host
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.address}
                    </p>
                  </div>
                  <Badge 
                    variant={match.status === "confirmed" ? "default" : "outline"}
                    className={`rounded-full text-[10px] ${
                      match.status === "confirmed" 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                        : "text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {match.status === "confirmed" ? "Đã xác nhận" : "Chờ xác nhận"}
                  </Badge>
                </div>

                {/* Time & Date */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{match.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{match.time}</span>
                  </div>
                </div>

                {/* Skill Levels */}
                <div className="flex items-center gap-2 mb-4">
                  {match.levels.map((level) => (
                    <SkillBadge key={level} level={level} size="xs" showIcon={false} />
                  ))}
                </div>

                {/* Players */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Người chơi</span>
                    <span className="text-xs font-medium">
                      {match.players.length}/{match.maxPlayers}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {match.players.slice(0, 5).map((player) => (
                        <Avatar key={player.id} className="w-8 h-8 border-2 border-card">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {match.players.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-medium">
                          +{match.players.length - 5}
                        </div>
                      )}
                    </div>
                    {match.maxPlayers - match.players.length > 0 && (
                      <div className="flex items-center gap-1 ml-3">
                        <div className="flex -space-x-1">
                          {Array.from({ length: Math.min(match.maxPlayers - match.players.length, 3) }).map((_, i) => (
                            <div 
                              key={i}
                              className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                            >
                              <Users className="w-3 h-3 text-muted-foreground/30" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {match.hasChat && (
                    <Button variant="outline" size="sm" className="flex-1 rounded-full">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat nhóm
                    </Button>
                  )}
                  <Button size="sm" className="flex-1 rounded-full">
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {pastMatches.map((match) => (
              <Card 
                key={match.id}
                className="p-4 rounded-2xl border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{match.venue}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{match.date} • vs {match.opponent}</p>
                    <Badge 
                      className={`rounded-full text-[10px] ${
                        match.result === "Thắng" 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {match.result}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      match.grChange > 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {match.grChange > 0 ? "+" : ""}{match.grChange}
                    </span>
                    <p className="text-[10px] text-muted-foreground">GR</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
