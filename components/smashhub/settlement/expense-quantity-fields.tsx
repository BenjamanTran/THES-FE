"use client"

import { Input } from "@/components/ui/input"
import { formatVnd } from "@/lib/format"
import { expenseUnitLabel } from "@/lib/settlement/settlement-math"
import { SettlementThousandsInput } from "./settlement-thousands-input"

interface ExpenseQuantityFieldsProps {
  unitLabel: string
  quantity: number
  unitVnd: number
  totalVnd: number
  disabled?: boolean
  onQuantityChange: (quantity: number) => void
  onUnitVndChange: (unitVnd: number) => void
}

export function ExpenseQuantityFields({
  unitLabel,
  quantity,
  unitVnd,
  totalVnd,
  disabled,
  onQuantityChange,
  onUnitVndChange,
}: ExpenseQuantityFieldsProps) {
  const suffix = expenseUnitLabel(unitLabel)

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <div className="relative min-w-[3.5rem] max-w-[5rem] flex-1">
        <Input
          type="text"
          inputMode="numeric"
          value={quantity > 0 ? String(quantity) : ""}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, "")) || 0
            onQuantityChange(Math.max(0, Math.floor(n)))
          }}
          placeholder="0"
          disabled={disabled}
          className="h-9 text-xs pr-1 tabular-nums"
          style={{ paddingRight: `${Math.min(28, 8 + suffix.length * 5)}px` }}
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground truncate max-w-[2.5rem]">
          {suffix}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">×</span>
      <SettlementThousandsInput
        valueVnd={unitVnd}
        onChangeVnd={onUnitVndChange}
        disabled={disabled}
        className="w-[4.5rem] shrink-0"
      />
      <span className="text-[10px] text-muted-foreground min-w-[4.5rem] text-right tabular-nums shrink-0">
        = {formatVnd(totalVnd)}
      </span>
    </div>
  )
}
