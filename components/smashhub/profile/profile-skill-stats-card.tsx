"use client"

import { Trophy, Target, TrendingUp, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { SkillBadge } from "../skill-badge"
import { ratingToStars } from "@/lib/rating-stars"

interface ProfileSkillStatsCardProps {
  declaredRank: import("@/lib/api").AuthUser["declared_rank"]
  apiStats: import("@/lib/api").AuthUser["stats"]
  matchStats: import("@/lib/api").AuthUser["rank"]
}

export function ProfileSkillStatsCard({declaredRank, apiStats, matchStats}: ProfileSkillStatsCardProps) {
  return (
        <div className="px-4 pb-4">
          <Card className="bg-gradient-to-br from-accent to-accent/80 border-0 p-4 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex items-start justify-between mb-4 relative z-10 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Trình độ khai báo</p>
                {declaredRank ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <SkillBadge level={declaredRank.tier} size="sm" />
                    </div>
                    <p className="text-2xl font-bold truncate">{declaredRank.display_name}</p>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= ratingToStars(declaredRank.tier, declaredRank.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa khai báo trình độ</p>
                )}
              </div>
              {declaredRank && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground mb-1">Điểm khai báo</p>
                  <p className="text-2xl font-bold text-primary">
                    {declaredRank.rating.toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-10">
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <p className="text-lg font-bold">{apiStats?.win_rate ?? 0}%</p>
                <p className="text-[10px] text-muted-foreground">Tỷ lệ thắng</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold">{matchStats?.matches_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Tổng trận</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-background/10">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">
                  {apiStats?.global_rank != null ? `#${apiStats.global_rank}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Hạng GR</p>
              </div>
            </div>
          </Card>
        </div>
  )
}
