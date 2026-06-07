"use client"

import { useState } from "react"
import { Check, Copy, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGameSettlement } from "@/hooks/use-game-settlement"
import { formatSettlementCopy } from "@/lib/settlement/settlement-copy"
import { SplitEvenlyPanel } from "./split-evenly-panel"
import { FixedPricePanel } from "./fixed-price-panel"

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
    (vm.computed.mode === "fixed_price" || vm.computed.per_player.length > 0)

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
              <Tabs
                value={vm.draft.mode}
                onValueChange={(v) => {
                  if (vm.readOnly) return
                  vm.setDraft({ ...vm.draft, mode: v as typeof vm.draft.mode })
                }}
              >
                <TabsList className="w-full grid grid-cols-2 h-9 bg-secondary/50">
                  <TabsTrigger
                    value="split_evenly"
                    disabled={vm.readOnly}
                    className="h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Chia đều
                  </TabsTrigger>
                  <TabsTrigger
                    value="fixed_price"
                    disabled={vm.readOnly}
                    className="h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Thu cố định
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {vm.draft.mode === "split_evenly" ? (
                <SplitEvenlyPanel
                  draft={vm.draft}
                  onDraftChange={vm.setDraft}
                  computed={vm.computed}
                  disabled={vm.readOnly}
                />
              ) : (
                <FixedPricePanel
                  draft={vm.draft}
                  onDraftChange={vm.setDraft}
                  computed={vm.computed}
                  disabled={vm.readOnly}
                />
              )}
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
