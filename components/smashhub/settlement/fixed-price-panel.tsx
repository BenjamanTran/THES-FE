"use client"

import { Label } from "@/components/ui/label"
import { SettlementThousandsInput } from "./settlement-thousands-input"
import { formatVnd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { totalExpense, type SettlementComputed, type SettlementDraft } from "@/lib/settlement/settlement-math"
import { ExpenseLinesEditor } from "./expense-lines-editor"

interface FixedPricePanelProps {
  draft: SettlementDraft
  onDraftChange: (draft: SettlementDraft) => void
  computed: SettlementComputed | null
  disabled?: boolean
}

export function FixedPricePanel({
  draft,
  onDraftChange,
  computed,
  disabled,
}: FixedPricePanelProps) {
  const expenseTotal = totalExpense(draft.expense_lines)

  return (
    <div className="space-y-4">
      <ExpenseLinesEditor
        lines={draft.expense_lines}
        onChange={(expense_lines) => onDraftChange({ ...draft, expense_lines })}
        disabled={disabled}
        total={expenseTotal}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Giá thu / nam (nghìn)</Label>
          <SettlementThousandsInput
            valueVnd={draft.fixed_male_price}
            onChangeVnd={(fixed_male_price) => onDraftChange({ ...draft, fixed_male_price })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Giá thu / nữ (nghìn)</Label>
          <SettlementThousandsInput
            valueVnd={draft.fixed_female_price}
            onChangeVnd={(fixed_female_price) => onDraftChange({ ...draft, fixed_female_price })}
            disabled={disabled}
          />
        </div>
      </div>

      {computed && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { label: "Tổng chi", value: computed.total_expense, tone: "text-foreground" },
                { label: "Tổng thu", value: computed.revenue, tone: "text-foreground" },
                {
                  label: "Lợi nhuận",
                  value: computed.profit,
                  tone: computed.profit >= 0 ? "text-emerald-500" : "text-red-500",
                },
              ] as const
            ).map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/50 bg-secondary/20 px-2 py-2.5 text-center"
              >
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className={cn("text-sm font-bold tabular-nums mt-0.5", item.tone)}>
                  {formatVnd(item.value)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {computed.male_count} nam × {formatVnd(draft.fixed_male_price)} · {computed.female_count}{" "}
            nữ × {formatVnd(draft.fixed_female_price)}
          </p>
          {computed.warnings.map((w) => (
            <p key={w} className="text-[10px] text-amber-500/90 text-center">
              {w}
            </p>
          ))}
        </>
      )}
    </div>
  )
}
