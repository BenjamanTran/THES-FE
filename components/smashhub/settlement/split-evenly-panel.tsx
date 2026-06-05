"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatVnd } from "@/lib/format"
import {
  GENDER_STEP_VND,
  maxGenderSteps,
  totalExpense,
  type SettlementComputed,
  type SettlementDraft,
} from "@/lib/settlement/settlement-math"
import { ExpenseLinesEditor } from "./expense-lines-editor"

interface SplitEvenlyPanelProps {
  draft: SettlementDraft
  onDraftChange: (draft: SettlementDraft) => void
  computed: SettlementComputed | null
  disabled?: boolean
}

export function SplitEvenlyPanel({
  draft,
  onDraftChange,
  computed,
  disabled,
}: SplitEvenlyPanelProps) {
  const expenseTotal = totalExpense(draft.expense_lines)
  const canAdjustGender =
    !disabled &&
    (computed?.male_count ?? 0) >= 1 &&
    (computed?.female_count ?? 0) >= 1
  const maxSteps = maxGenderSteps(
    expenseTotal,
    computed?.male_count ?? 0,
    computed?.female_count ?? 0,
  )

  const setSteps = (steps: number) => {
    onDraftChange({
      ...draft,
      gender_adjustment_steps: Math.max(-maxSteps, Math.min(maxSteps, steps)),
    })
  }

  return (
    <div className="space-y-4">
      <ExpenseLinesEditor
        lines={draft.expense_lines}
        onChange={(expense_lines) => onDraftChange({ ...draft, expense_lines })}
        disabled={disabled}
        total={expenseTotal}
      />

      {canAdjustGender && (
        <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-foreground mb-2">Cảm tính nam / nữ</p>
          <p className="text-[10px] text-muted-foreground mb-2">
            Mỗi bước ±{formatVnd(GENDER_STEP_VND)} trên đơn giá nam; nữ tự cân bằng tổng chi.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              disabled={draft.gender_adjustment_steps <= -maxSteps}
              onClick={() => setSteps(draft.gender_adjustment_steps - 1)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold tabular-nums min-w-[4rem] text-center">
              {draft.gender_adjustment_steps > 0 ? "+" : ""}
              {draft.gender_adjustment_steps}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full"
              disabled={draft.gender_adjustment_steps >= maxSteps}
              onClick={() => setSteps(draft.gender_adjustment_steps + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {computed?.warnings.map((w) => (
        <p key={w} className="text-[10px] text-amber-500/90">
          {w}
        </p>
      ))}
      {computed?.errors.map((e) => (
        <p key={e} className="text-[10px] text-destructive">
          {e}
        </p>
      ))}

      {computed && computed.per_player.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-secondary/30 border-b border-border/40">
            <p className="text-[11px] font-semibold">Chia cho từng người</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Làm tròn lên hàng 500đ; tổng thu có thể cao hơn chi.
            </p>
            {computed.male_unit != null && computed.female_unit != null && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Nam {formatVnd(computed.male_unit)} × {computed.male_count} · Nữ{" "}
                {formatVnd(computed.female_unit)} × {computed.female_count}
              </p>
            )}
          </div>
          <div className="divide-y divide-border/30">
            {computed.per_player.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="truncate">{p.name || `#${p.id}`}</span>
                <span className="font-bold tabular-nums">{formatVnd(p.amount)}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 bg-primary/5 border-t border-border/40 space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Tổng thu</span>
              <span className="text-primary tabular-nums">{formatVnd(computed.revenue)}</span>
            </div>
            {computed.profit > 0 && (
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>So với chi ({formatVnd(computed.total_expense)})</span>
                <span className="text-emerald-500 tabular-nums">+{formatVnd(computed.profit)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
