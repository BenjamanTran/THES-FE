"use client"

import { ChevronRight, Trophy, Target, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MockSection } from "../mock-section"
import { achievements, recentActivity } from "./mock-data"

interface ProfileMockSectionsProps {
  userStats: typeof import("./mock-data").userStatsMock & { name: string; email?: string | null }
}

export function ProfileMockSections({ userStats }: ProfileMockSectionsProps) {
  return (
    <>
        <div className="px-4 pb-4">
          <MockSection>
          <Card className="p-4 rounded-2xl border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Thắng / Thua</span>
              <span className="text-xs text-muted-foreground">
                {userStats.wins}W - {userStats.losses}L
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-red-500/30">
              <div 
                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(userStats.wins / userStats.totalMatches) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-emerald-400">{userStats.wins} Thắng</span>
              <span className="text-xs text-red-400">{userStats.losses} Thua</span>
            </div>
          </Card>
          </MockSection>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-4">
          <MockSection>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 rounded-2xl border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Thời gian chơi</p>
                  <p className="font-bold">{userStats.playTime}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-2xl border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sân yêu thích</p>
                  <p className="font-bold text-sm truncate max-w-[100px]">{userStats.favoriteVenue}</p>
                </div>
              </div>
            </Card>
          </div>
          </MockSection>
        </div>

        {/* Achievements */}
        <div className="px-4 pb-4">
          <MockSection>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Thành tích</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
              Xem tất cả
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                  achievement.unlocked 
                    ? "bg-primary/10 border border-primary/30" 
                    : "bg-secondary/50 border border-border/30 opacity-50"
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <span className="text-[8px] mt-1 text-muted-foreground text-center px-1 truncate w-full">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
          </MockSection>
        </div>

        {/* Recent Activity */}
        <div className="px-4 pb-8">
          <MockSection>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Hoạt động gần đây</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-semibold">
              Xem tất cả
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <Card 
                key={index}
                className="p-3 rounded-2xl border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "match" 
                      ? activity.gr?.startsWith("+") 
                        ? "bg-emerald-500/20" 
                        : "bg-red-500/20"
                      : "bg-primary/20"
                  }`}>
                    {activity.type === "match" ? (
                      <span className="text-lg">🏸</span>
                    ) : (
                      <span className="text-lg">{activity.badge}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.gr && (
                    <span className={`font-bold ${
                      activity.gr.startsWith("+") ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {activity.gr}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
          </MockSection>
        </div>
    </>
  )
}