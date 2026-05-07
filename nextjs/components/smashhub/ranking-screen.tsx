"use client"

import { useState } from "react"
import { Trophy, Users, Medal, ChevronRight, Crown, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkillBadge } from "./skill-badge"
import { cn } from "@/lib/utils"

const topPlayers = [
  { rank: 1, name: "Nguyễn Tiến Minh", gr: 3250, level: "Chuyên nghiệp", avatar: "/placeholder.svg?height=60&width=60", winRate: 92, matches: 487 },
  { rank: 2, name: "Vũ Thị Trang", gr: 3180, level: "Chuyên nghiệp", avatar: "/placeholder.svg?height=60&width=60", winRate: 89, matches: 423 },
  { rank: 3, name: "Đặng Nam Thành", gr: 3120, level: "Chuyên nghiệp", avatar: "/placeholder.svg?height=60&width=60", winRate: 87, matches: 398 },
]

const leaderboard = [
  { rank: 4, name: "Trần Hoàng Long", gr: 3050, level: "Bán chuyên", avatar: "/placeholder.svg?height=40&width=40", change: "+2" },
  { rank: 5, name: "Lê Minh Đức", gr: 2980, level: "Bán chuyên", avatar: "/placeholder.svg?height=40&width=40", change: "-1" },
  { rank: 6, name: "Phạm Văn Nam", gr: 2920, level: "Bán chuyên", avatar: "/placeholder.svg?height=40&width=40", change: "+5" },
  { rank: 7, name: "Ngô Thanh Tùng", gr: 2870, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "0" },
  { rank: 8, name: "Hoàng Phương Anh", gr: 2830, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "+3" },
  { rank: 9, name: "Đỗ Hải Đăng", gr: 2780, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "-2" },
  { rank: 10, name: "Bùi Mai Lan", gr: 2720, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "+1" },
]

const friendsLeaderboard = [
  { rank: 1, name: "Minh Đức", gr: 2650, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "+3" },
  { rank: 2, name: "Hoàng Long", gr: 2580, level: "Khá", avatar: "/placeholder.svg?height=40&width=40", change: "+1" },
  { rank: 3, name: "Văn Nam", gr: 2520, level: "Trung bình +", avatar: "/placeholder.svg?height=40&width=40", change: "-1" },
  { rank: 4, name: "Thanh Tùng", gr: 2490, level: "Trung bình +", avatar: "/placeholder.svg?height=40&width=40", change: "+2" },
  { rank: 5, name: "Phương Anh", gr: 2450, level: "Trung bình +", avatar: "/placeholder.svg?height=40&width=40", change: "0" },
]

// Current user data
const currentUser = {
  rank: 247,
  name: "Tuấn Hưng",
  gr: 2480,
  level: "Khá",
  avatar: "/placeholder.svg?height=40&width=40",
  change: "+12",
}

export function RankingScreen() {
  const [tab, setTab] = useState<"global" | "friends">("global")

  const activeLeaderboard = tab === "global" ? leaderboard : friendsLeaderboard

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Bảng xếp hạng</h1>
          <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
            Cách tính GR
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "global" | "friends")}>
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger 
              value="global" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              Toàn cầu
            </TabsTrigger>
            <TabsTrigger 
              value="friends" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Bạn bè
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === "global" && (
          /* Podium - Only for Global */
          <div className="px-4 pt-6 pb-4">
            <div className="flex items-end justify-center gap-2">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="w-14 h-14 ring-2 ring-gray-400 mb-2">
                  <AvatarImage src={topPlayers[1].avatar} alt={topPlayers[1].name} />
                  <AvatarFallback className="bg-gray-500/20 text-gray-400">{topPlayers[1].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-t from-gray-500/30 to-gray-500/10 rounded-t-xl w-20 h-24 flex flex-col items-center justify-end pb-3 relative">
                  <div className="absolute -top-3 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <Medal className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-400">2</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[72px] text-center">{topPlayers[1].name}</span>
                  <span className="text-xs font-bold mt-1">{topPlayers[1].gr}</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-4">
                <div className="relative">
                  <Avatar className="w-18 h-18 ring-4 ring-amber-400 mb-2">
                    <AvatarImage src={topPlayers[0].avatar} alt={topPlayers[0].name} />
                    <AvatarFallback className="bg-amber-500/20 text-amber-400">{topPlayers[0].name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-t from-amber-500/30 to-amber-500/10 rounded-t-xl w-24 h-32 flex flex-col items-center justify-end pb-3 relative">
                  <div className="absolute -top-3 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-amber-400">1</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[88px] text-center">{topPlayers[0].name}</span>
                  <span className="text-sm font-bold mt-1">{topPlayers[0].gr}</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="w-14 h-14 ring-2 ring-amber-700 mb-2">
                  <AvatarImage src={topPlayers[2].avatar} alt={topPlayers[2].name} />
                  <AvatarFallback className="bg-amber-700/20 text-amber-700">{topPlayers[2].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-t from-amber-700/30 to-amber-700/10 rounded-t-xl w-20 h-20 flex flex-col items-center justify-end pb-3 relative">
                  <div className="absolute -top-3 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center">
                    <Medal className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-amber-700">3</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[72px] text-center">{topPlayers[2].name}</span>
                  <span className="text-xs font-bold mt-1">{topPlayers[2].gr}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="px-4 py-2">
          <div className="space-y-2">
            {activeLeaderboard.map((player, index) => (
              <Card 
                key={player.rank}
                className={cn(
                  "p-3 rounded-2xl border-border/50 hover:border-primary/30 transition-colors cursor-pointer",
                  index < 3 && tab === "friends" && "border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index < 3 && tab === "friends" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {tab === "global" ? player.rank : index + 1}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={player.avatar} alt={player.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{player.name}</h3>
                    <SkillBadge level={player.level} size="xs" showIcon={false} />
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{player.gr}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      player.change.startsWith("+") ? "text-emerald-400" : 
                      player.change.startsWith("-") ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {player.change !== "0" && (
                        <>
                          {player.change.startsWith("+") ? "↑" : player.change.startsWith("-") ? "↓" : ""}
                          {player.change.replace(/[+-]/, "")}
                        </>
                      )}
                      {player.change === "0" && "—"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed User Rank Bar */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto z-30 px-4">
        <Card className="glass border-primary/30 p-3 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">#{currentUser.rank}</span>
            </div>
            
            <Avatar className="w-10 h-10 ring-2 ring-primary/30">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {currentUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Bạn</h3>
                <SkillBadge level={currentUser.level} size="xs" showIcon={false} />
              </div>
              <p className="text-xs text-muted-foreground">Xếp hạng của bạn</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-lg">{currentUser.gr}</p>
              <p className="text-xs font-medium text-emerald-400 flex items-center justify-end gap-0.5">
                <Flame className="w-3 h-3" />
                {currentUser.change}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
