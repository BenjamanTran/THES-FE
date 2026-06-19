"use client"

import { useMemo, useState } from "react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Activity, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SkillRadarSnapshot, Tier } from "@/lib/api"
import { radarColorForTier, SKILL_RADAR_AXES } from "@/lib/skill-radar"
import { SkillBadge } from "../skill-badge"
import { formatStars } from "../star-rating"

interface ProfileSkillRadarCardProps {
  skillRadar: SkillRadarSnapshot | null | undefined
  skillHistory: SkillRadarSnapshot[] | undefined
  fallbackTier?: Tier | null
  onEdit: () => void
}

function formatMonth(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", year: "numeric" }).format(date)
}

export function ProfileSkillRadarCard({ skillRadar, skillHistory, fallbackTier, onEdit }: ProfileSkillRadarCardProps) {
  const history = skillHistory?.length ? skillHistory : skillRadar ? [skillRadar] : []
  const [selectedMonth, setSelectedMonth] = useState(history[0]?.month)
  const selected = history.find((item) => item.month === selectedMonth) ?? history[0] ?? null
  const previous = history.find((item) => item.month < (selected?.month ?? ""))
  const tier = selected?.declared_tier ?? fallbackTier
  const tierColor = radarColorForTier(tier)

  const chartData = useMemo(() => {
    if (!selected) return []

    return SKILL_RADAR_AXES.map((axis) => {
      const currentAxis = selected.axes.find((item) => item.key === axis.key)
      const previousAxis = previous?.axes.find((item) => item.key === axis.key)

      return {
        key: axis.key,
        label: axis.shortLabel,
        score: currentAxis?.score ?? 0,
        previous: previousAxis?.score,
      }
    })
  }, [previous, selected])

  return (
    <div className="px-4 pb-4">
      <Card className="rounded-2xl border-border/50 p-4 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: tierColor }} />
              <h3 className="text-sm font-semibold">Hồ sơ kỹ năng</h3>
              {tier && <SkillBadge level={tier} size="xs" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {selected ? `Cập nhật ${formatMonth(selected.month)}` : "Chưa có dữ liệu"}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={onEdit}>
            Cập nhật
          </Button>
        </div>

        {selected ? (
          <>
            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="h-64 min-w-0 -mx-1 sm:mx-0">
                <ResponsiveContainer width="104%" height="100%">
                  <RadarChart data={chartData} outerRadius="70%" margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, name) => [`${value}/10`, name === "Hiện tại" ? "Hiện tại" : "Tháng trước"]}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    {previous && (
                      <Radar
                        name="Tháng trước"
                        dataKey="previous"
                        stroke="var(--muted-foreground)"
                        fill="var(--muted-foreground)"
                        fillOpacity={0.12}
                        strokeDasharray="4 4"
                      />
                    )}
                    <Radar
                      name="Hiện tại"
                      dataKey="score"
                      stroke={tierColor}
                      fill={tierColor}
                      fillOpacity={0.36}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-20 rounded-2xl px-3 py-4 text-center" style={{ backgroundColor: `${tierColor}1f` }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Điểm TB</p>
                <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: tierColor }}>
                  {selected.overall_score.toFixed(1)}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatStars(selected.computed_stars)}/5 sao
                </p>
              </div>
            </div>

            {history.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {history.map((item) => {
                  const active = item.month === selected.month

                  return (
                    <button
                      key={item.month}
                      type="button"
                      onClick={() => setSelectedMonth(item.month)}
                      className={
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary/40 text-muted-foreground")
                      }
                    >
                      {formatMonth(item.month)}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary/40 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Chưa chấm kỹ năng tháng này</p>
              <p className="text-xs text-muted-foreground">Điểm kỹ năng sẽ tạo trình độ khai báo mới.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
