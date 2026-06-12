"use client"

import { useState } from "react"
import { Check, Copy, Loader2, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useGameSettlement } from "@/hooks/use-game-settlement"
import { formatSettlementCopy } from "@/lib/settlement/settlement-copy"
import { formatVnd } from "@/lib/format"
import { newSection, type SettlementSection } from "@/lib/settlement/settlement-math"
import { SettlementSectionCard } from "./settlement-section-card"

interface GameSettlementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: number | null
  onPublished?: () => void
}

export function GameSettlementSheet({
  open,
  onOpenChange,
  gameId,
  onPublished,
}: GameSettlementSheetProps) {
  const vm = useGameSettlement(gameId, open)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!vm.computed) return
    const title = vm.game?.title || undefined
    const text = formatSettlementCopy(vm.computed, title)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Đã copy")
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePublish = async () => {
    await vm.publish()
    onPublished?.()
  }

  const allPlayers = (vm.game?.players ?? [])
    .filter((p) => p.arrived_at_court)
    .map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      arrived_at_court: p.arrived_at_court,
    }))

  const handleAddSection = () => {
    const prev = vm.draft.sections[vm.draft.sections.length - 1]
    const inheritedIds = prev ? [...prev.participant_ids] : allPlayers.map((p) => p.id)
    const nextLabel = `Phần ${vm.draft.sections.length + 1}`
    vm.setDraft({
      ...vm.draft,
      sections: [...vm.draft.sections, newSection(nextLabel, inheritedIds)],
    })
  }

  const handleSectionChange = (index: number, next: SettlementSection) => {
    vm.setDraft({
      ...vm.draft,
      sections: vm.draft.sections.map((s, i) => (i === index ? next : s)),
    })
  }

  const handleSectionRemove = (index: number) => {
    if (vm.draft.sections.length <= 1) return
    vm.setDraft({
      ...vm.draft,
      sections: vm.draft.sections.filter((_, i) => i !== index),
    })
  }

  const canSave =
    vm.computed &&
    vm.computed.errors.length === 0 &&
    !vm.readOnly &&
    (vm.hasUnsavedChanges || !vm.published)

  const canPublish =
    vm.computed &&
    vm.computed.errors.length === 0 &&
    !vm.readOnly &&
    !vm.published &&
    vm.computed.per_player.length > 0

  const gameLabel =
    vm.game?.title ||
    (vm.game ? `Game #${vm.game.id}` : gameId ? `Game #${gameId}` : "")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto h-[90dvh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30 shrink-0">
          <SheetTitle className="text-base flex flex-col items-start gap-0.5">
            <span className="truncate max-w-full">Tính tiền — {gameLabel}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {vm.statusLabel}
              {vm.hasUnsavedChanges && !vm.readOnly ? " · Chưa lưu" : ""}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {vm.loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : vm.error ? (
            <p className="text-sm text-destructive text-center py-8">{vm.error}</p>
          ) : vm.hiddenMessage && vm.readOnly ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-muted-foreground">{vm.hiddenMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vm.draft.sections.map((section, index) => (
                <SettlementSectionCard
                  key={section.id}
                  index={index}
                  section={section}
                  onChange={(next) => handleSectionChange(index, next)}
                  onRemove={
                    vm.draft.sections.length > 1
                      ? () => handleSectionRemove(index)
                      : undefined
                  }
                  computed={vm.computed?.sections[index] ?? null}
                  allPlayers={allPlayers}
                  disabled={vm.readOnly}
                />
              ))}

              {!vm.readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full h-9 text-xs"
                  onClick={handleAddSection}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Thêm phần (đặt thêm giờ)
                </Button>
              )}

              {vm.computed && vm.computed.per_player.length > 0 && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
                  <div className="px-3 py-2 border-b border-primary/20">
                    <p className="text-xs font-semibold text-primary">Tổng cộng từng người</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {vm.computed.per_player.map((p) => (
                      <div key={p.id} className="px-3 py-2">
                        <div className="flex justify-between text-xs">
                          <span className="truncate font-medium">{p.name || `#${p.id}`}</span>
                          <span className="font-bold tabular-nums text-primary">
                            {formatVnd(p.amount)}
                          </span>
                        </div>
                        {p.sections.length > 1 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {p.sections
                              .map((s) => `${s.label}: ${formatVnd(s.amount)}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 bg-primary/10 border-t border-primary/20 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Tổng chi</span>
                      <span className="font-semibold tabular-nums">
                        {formatVnd(vm.computed.total_expense)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng thu</span>
                      <span className="font-semibold tabular-nums text-primary">
                        {formatVnd(vm.computed.revenue)}
                      </span>
                    </div>
                    {vm.computed.total_expense > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span>So với chi</span>
                        <span
                          className={
                            vm.computed.profit > 0
                              ? "text-emerald-500 tabular-nums"
                              : vm.computed.profit < 0
                                ? "text-destructive tabular-nums"
                                : "tabular-nums"
                          }
                        >
                          {vm.computed.profit > 0 ? "+" : ""}
                          {formatVnd(vm.computed.profit)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {vm.computed?.warnings.map((w) => (
                <p key={w} className="text-[10px] text-amber-500/90">
                  {w}
                </p>
              ))}
              {vm.computed?.errors.map((e) => (
                <p key={e} className="text-[10px] text-destructive">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>

        {!vm.loading && !vm.error && !(vm.hiddenMessage && vm.readOnly) && (
          <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border/30 flex flex-col gap-2">
            {vm.computed && vm.computed.errors.length === 0 && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full h-9 text-xs"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Đã copy
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy chia tiền
                  </>
                )}
              </Button>
            )}
            {!vm.readOnly && (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full h-9 text-xs"
                  disabled={vm.loading || vm.saving}
                  onClick={() => void vm.refreshPlayers()}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Tải lại danh sách người chơi
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={vm.published ? "default" : "outline"}
                    className="flex-1 rounded-full h-9 text-xs"
                    disabled={!canSave || vm.saving || vm.publishing}
                    onClick={() => void vm.saveSettlement()}
                  >
                    {vm.saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : vm.published ? (
                      "Cập nhật"
                    ) : (
                      "Lưu nháp"
                    )}
                  </Button>
                  {!vm.published && (
                    <Button
                      type="button"
                      className="flex-1 rounded-full h-9 text-xs"
                      disabled={!canPublish || vm.publishing || vm.saving}
                      onClick={() => void handlePublish()}
                    >
                      {vm.publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Công bố"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
