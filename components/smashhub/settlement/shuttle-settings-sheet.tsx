"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatVnd } from "@/lib/format"
import {
  DEFAULT_SHUTTLE_SETTINGS,
  perShuttleVnd,
  type ShuttleSettings,
} from "@/lib/settlement/shuttle-expense"
import { SettlementThousandsInput } from "./settlement-thousands-input"

interface ShuttleSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ShuttleSettings
  onSave: (settings: ShuttleSettings) => void
  disabled?: boolean
}

export function ShuttleSettingsSheet({
  open,
  onOpenChange,
  settings,
  onSave,
  disabled,
}: ShuttleSettingsSheetProps) {
  const [name, setName] = useState(settings.name)
  const [tubeVnd, setTubeVnd] = useState(settings.tube_vnd)
  const [perTube, setPerTube] = useState(settings.per_tube)

  useEffect(() => {
    if (!open) return
    setName(settings.name)
    setTubeVnd(settings.tube_vnd)
    setPerTube(settings.per_tube)
  }, [open, settings])

  const perShuttle = perShuttleVnd(tubeVnd, perTube)

  const handleSave = () => {
    onSave({
      name: name.trim() || DEFAULT_SHUTTLE_SETTINGS.name,
      tube_vnd: tubeVnd,
      per_tube: Math.max(1, Math.floor(perTube) || DEFAULT_SHUTTLE_SETTINGS.per_tube),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Cài đặt cầu</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pb-4">
          <p className="text-[11px] text-muted-foreground">
            Giá 1 quả = giá ống ÷ số quả/ống. Mặc định: {DEFAULT_SHUTTLE_SETTINGS.name},{" "}
            {formatVnd(DEFAULT_SHUTTLE_SETTINGS.tube_vnd)}/{DEFAULT_SHUTTLE_SETTINGS.per_tube} quả.
          </p>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Loại cầu</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              placeholder="Cầu 88"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Giá 1 ống (nghìn)</Label>
            <SettlementThousandsInput
              valueVnd={tubeVnd}
              onChangeVnd={setTubeVnd}
              disabled={disabled}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Số quả / ống</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={perTube > 0 ? String(perTube) : ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "")) || 0
                setPerTube(Math.max(1, n))
              }}
              disabled={disabled}
              className="h-9 text-sm tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground rounded-xl bg-secondary/40 px-3 py-2">
            → <span className="font-semibold text-foreground">{formatVnd(perShuttle)}</span> / quả
          </p>
          <Button
            type="button"
            className="w-full rounded-full"
            disabled={disabled}
            onClick={handleSave}
          >
            Áp dụng
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
