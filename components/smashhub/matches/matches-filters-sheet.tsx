"use client"

import { Filter, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SKILL_LABELS } from "../skill-badge"
import {
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  TIER_OPTIONS,
  type MatchTypeFilter,
} from "./constants"
import type { MatchesVm } from "./types"

export function MatchesFiltersSheet({ vm }: { vm: MatchesVm }) {
  const {
    geo,
    draftFilters,
    setDraftFilters,
    filterOpen,
    setFilterOpen,
    filters,
    activeFilterCount,
    applyDraft,
    resetDraft,
  } = vm

  return (
    <Sheet
      open={filterOpen}
      onOpenChange={(open) => {
        if (open) setDraftFilters(filters)
        setFilterOpen(open)
      }}
    >
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
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85dvh] overflow-y-auto px-4 sm:px-6"
      >
        <SheetHeader className="px-0 pb-4">
          <SheetTitle className="text-left">Bộ lọc</SheetTitle>
          <SheetDescription className="sr-only">
            Tinh chỉnh bộ lọc để tìm trận đấu phù hợp.
          </SheetDescription>
        </SheetHeader>
                <div className="space-y-6 pb-6 safe-bottom">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">Định vị</Label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFilters((f) => ({ ...f, useLocation: !f.useLocation }))
                        }
                        className={`text-xs font-medium ${
                          draftFilters.useLocation ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {draftFilters.useLocation ? "Đang bật" : "Đã tắt"}
                      </button>
                    </div>
                    {draftFilters.useLocation && geo.status !== "granted" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full mb-2"
                        onClick={geo.request}
                      >
                        Cho phép định vị
                      </Button>
                    )}
                    {draftFilters.useLocation && (
                      <div className="flex gap-2 flex-wrap">
                        {RADIUS_OPTIONS.map((r) => (
                          <Badge
                            key={r}
                            variant={draftFilters.radiusKm === r ? "default" : "outline"}
                            className="cursor-pointer px-3 py-2 rounded-full text-xs"
                            onClick={() => setDraftFilters((f) => ({ ...f, radiusKm: r }))}
                          >
                            {r} km
                          </Badge>
                        ))}
                      </div>
                    )}
                    {draftFilters.useLocation && geo.status !== "granted" && (
                      <p className="text-[11px] text-amber-400 mt-2">
                        Cần cấp quyền vị trí để lọc theo bán kính.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Trình độ</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant={draftFilters.tier === null ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2 rounded-full text-xs"
                        onClick={() => setDraftFilters((f) => ({ ...f, tier: null }))}
                      >
                        Tất cả
                      </Badge>
                      {TIER_OPTIONS.map((t) => (
                        <Badge
                          key={t}
                          variant={draftFilters.tier === t ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() => setDraftFilters((f) => ({ ...f, tier: t }))}
                        >
                          {SKILL_LABELS[t]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Thể thức</Label>
                    <div className="flex gap-2">
                      {(["any", "singles", "doubles"] as MatchTypeFilter[]).map((mt) => (
                        <Badge
                          key={mt}
                          variant={draftFilters.matchType === mt ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() => setDraftFilters((f) => ({ ...f, matchType: mt }))}
                        >
                          {mt === "any" ? "Cả 2" : mt === "singles" ? "Đơn" : "Đôi"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Ngân sách tối đa / slot
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {PRICE_OPTIONS.map((opt) => (
                        <Badge
                          key={opt.value}
                          variant={draftFilters.priceMax === opt.value ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 rounded-full text-xs"
                          onClick={() =>
                            setDraftFilters((f) => ({ ...f, priceMax: opt.value }))
                          }
                        >
                          {opt.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Chỉ hiển thị trận có giá khởi điểm trong ngân sách.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Tuỳ chọn khác</Label>
                    <Card
                      className="p-3 rounded-2xl border-border/50 cursor-pointer"
                      onClick={() =>
                        setDraftFilters((f) => ({ ...f, notFull: !f.notFull }))
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Chỉ trận còn slot</p>
                          <p className="text-[11px] text-muted-foreground">
                            Ẩn trận đã đủ người
                          </p>
                        </div>
                        <Badge
                          variant={draftFilters.notFull ? "default" : "outline"}
                          className="rounded-full text-[10px]"
                        >
                          {draftFilters.notFull ? "Bật" : "Tắt"}
                        </Badge>
                      </div>
                    </Card>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={resetDraft}>
                      Đặt lại
                    </Button>
                    <Button className="flex-1 rounded-full" onClick={applyDraft}>
                      Áp dụng
                    </Button>
                  </div>
                </div>
      </SheetContent>
    </Sheet>
  )
}
