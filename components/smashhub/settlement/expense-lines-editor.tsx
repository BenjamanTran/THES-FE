"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  EXPENSE_PRESETS,
  applyExpenseLinePatch,
  newExpenseLine,
  type ExpenseLine,
  type SettlementDraft,
} from "@/lib/settlement/settlement-math"
import {
  applyShuttleSettingsToLines,
  isShuttleLine,
  newShuttleExpenseLine,
  resolveShuttleSettings,
  shuttleSettingsFromLine,
  type ShuttleSettings,
} from "@/lib/settlement/shuttle-expense"
import { formatVnd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ExpenseQuantityFields } from "./expense-quantity-fields"
import { ShuttleQuantityFields } from "./shuttle-quantity-fields"
import { ShuttleSettingsSheet } from "./shuttle-settings-sheet"

interface ExpenseLinesEditorProps {
  draft: SettlementDraft
  onDraftChange: (draft: SettlementDraft) => void
  disabled?: boolean
  total: number
}

export function ExpenseLinesEditor({ draft, onDraftChange, disabled, total }: ExpenseLinesEditorProps) {
  const lines = draft.expense_lines
  const shuttleSettings = resolveShuttleSettings(draft.shuttle_settings, lines)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsLineId, setSettingsLineId] = useState<string | null>(null)

  const updateLines = (expense_lines: ExpenseLine[]) => {
    onDraftChange({ ...draft, expense_lines })
  }

  const updateLine = (id: string, patch: Partial<ExpenseLine>) => {
    updateLines(lines.map((l) => (l.id === id ? applyExpenseLinePatch(l, patch) : l)))
  }

  const removeLine = (id: string) => {
    if (lines.length <= 1) return
    updateLines(lines.filter((l) => l.id !== id))
  }

  const addLine = (label = "") => {
    if (/^cầu/i.test(label)) {
      updateLines([...lines, newShuttleExpenseLine(shuttleSettings) as ExpenseLine])
      return
    }
    updateLines([...lines, newExpenseLine(label)])
  }

  const applyShuttleSettings = (next: ShuttleSettings) => {
    onDraftChange({
      ...draft,
      shuttle_settings: next,
      expense_lines: applyShuttleSettingsToLines(lines, next),
    })
  }

  const openShuttleSettings = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId)
    if (line && isShuttleLine(line)) {
      setSettingsLineId(lineId)
      setSettingsOpen(true)
    }
  }

  const settingsForSheet =
    settingsLineId != null
      ? shuttleSettingsFromLine(lines.find((l) => l.id === settingsLineId) ?? lines[0])
      : shuttleSettings

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Hạng mục chi</p>
        <p className="text-xs font-bold text-primary">{formatVnd(total)}</p>
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">
        Cầu: chỉ nhập số quả (⚙ đặt giá ống). Khác: số lượng × đơn giá K. Bỏ tick = không tính chi.
      </p>

      <div className="space-y-2">
        {lines.map((line) => {
          const included = line.included !== false
          const shuttle = isShuttleLine(line)
          const lineSettings = shuttle ? shuttleSettingsFromLine(line) : shuttleSettings

          return (
            <div
              key={line.id}
              className={cn("flex items-center gap-2", !included && "opacity-50")}
            >
              <Checkbox
                checked={included}
                onCheckedChange={(v) => updateLine(line.id, { included: v === true })}
                disabled={disabled}
                className="shrink-0"
                aria-label={included ? "Tính vào tổng chi" : "Không tính vào tổng chi"}
              />
              {shuttle ? (
                <span className="text-[10px] font-medium w-[4.25rem] shrink-0 truncate" title={lineSettings.name}>
                  {lineSettings.name}
                </span>
              ) : (
                <Input
                  value={line.label}
                  onChange={(e) => updateLine(line.id, { label: e.target.value })}
                  placeholder="Tên"
                  disabled={disabled}
                  className="h-9 text-xs w-[4.25rem] shrink-0"
                />
              )}
              {shuttle ? (
                <ShuttleQuantityFields
                  settings={lineSettings}
                  quantity={line.quantity}
                  totalVnd={line.amount}
                  disabled={disabled}
                  onQuantityChange={(quantity) => updateLine(line.id, { quantity })}
                  onOpenSettings={() => openShuttleSettings(line.id)}
                />
              ) : (
                <ExpenseQuantityFields
                  unitLabel={line.label}
                  quantity={line.quantity}
                  unitVnd={line.unit_vnd}
                  totalVnd={line.amount}
                  disabled={disabled}
                  onQuantityChange={(quantity) => updateLine(line.id, { quantity })}
                  onUnitVndChange={(unit_vnd) => updateLine(line.id, { unit_vnd })}
                />
              )}
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={disabled || lines.length <= 1}
                className="p-1.5 rounded-full text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {!disabled && (
        <div className="flex flex-wrap gap-1.5">
          {EXPENSE_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[10px] rounded-full px-2"
              onClick={() => addLine(preset)}
            >
              <Plus className="w-3 h-3 mr-0.5" />
              {preset}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[10px] rounded-full px-2"
            onClick={() => addLine()}
          >
            <Plus className="w-3 h-3 mr-0.5" />
            Thêm
          </Button>
        </div>
      )}

      <ShuttleSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settingsForSheet}
        onSave={applyShuttleSettings}
        disabled={disabled}
      />
    </div>
  )
}
