"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EXPENSE_PRESETS,
  applyExpenseLinePatch,
  newExpenseLine,
  type ExpenseLine,
} from "@/lib/settlement/settlement-math"
import { formatVnd } from "@/lib/format"
import { ExpenseQuantityFields } from "./expense-quantity-fields"

interface ExpenseLinesEditorProps {
  lines: ExpenseLine[]
  onChange: (lines: ExpenseLine[]) => void
  disabled?: boolean
  total: number
}

export function ExpenseLinesEditor({ lines, onChange, disabled, total }: ExpenseLinesEditorProps) {
  const updateLine = (id: string, patch: Partial<ExpenseLine>) => {
    onChange(lines.map((l) => (l.id === id ? applyExpenseLinePatch(l, patch) : l)))
  }

  const removeLine = (id: string) => {
    if (lines.length <= 1) return
    onChange(lines.filter((l) => l.id !== id))
  }

  const addLine = (label = "") => {
    onChange([...lines, newExpenseLine(label)])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Hạng mục chi</p>
        <p className="text-xs font-bold text-primary">{formatVnd(total)}</p>
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">
        Mỗi dòng: số lượng × đơn giá (K = nghìn, 31,5K = 31.500đ). Gõ , hoặc . đều được.
      </p>

      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center gap-2">
            <Input
              value={line.label}
              onChange={(e) => updateLine(line.id, { label: e.target.value })}
              placeholder="Tên"
              disabled={disabled}
              className="h-9 text-xs w-[4.25rem] shrink-0"
            />
            <ExpenseQuantityFields
              unitLabel={line.label}
              quantity={line.quantity}
              unitVnd={line.unit_vnd}
              totalVnd={line.amount}
              disabled={disabled}
              onQuantityChange={(quantity) => updateLine(line.id, { quantity })}
              onUnitVndChange={(unit_vnd) => updateLine(line.id, { unit_vnd })}
            />
            <button
              type="button"
              onClick={() => removeLine(line.id)}
              disabled={disabled || lines.length <= 1}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
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
    </div>
  )
}
