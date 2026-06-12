"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatVnd } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  ceilShareAmount,
  totalExpense,
  type SectionComputed,
  type SettlementPlayerInput,
  type SettlementSection,
} from "@/lib/settlement/settlement-math"
import { ExpenseLinesEditor } from "./expense-lines-editor"
import { SettlementThousandsInput } from "./settlement-thousands-input"

interface SettlementSectionCardProps {
  index: number
  section: SettlementSection
  onChange: (section: SettlementSection) => void
  onRemove?: () => void
  computed: SectionComputed | null
  allPlayers: SettlementPlayerInput[]
  disabled?: boolean
}

export function SettlementSectionCard({
  index,
  section,
  onChange,
  onRemove,
  computed,
  allPlayers,
  disabled,
}: SettlementSectionCardProps) {
  const expenseTotal = totalExpense(section.expense_lines)
  const participantIdSet = new Set(section.participant_ids)
  const maleCount = computed?.male_count ?? 0
  const femaleCount = computed?.female_count ?? 0
  const hasBothGenders = maleCount >= 1 && femaleCount >= 1
  const equalSplitPrice =
    hasBothGenders && expenseTotal > 0
      ? ceilShareAmount(expenseTotal / (maleCount + femaleCount))
      : 0
  const isUsingDefault = section.desired_female_price <= 0

  const toggleParticipant = (playerId: number) => {
    if (disabled) return
    const next = participantIdSet.has(playerId)
      ? section.participant_ids.filter((id) => id !== playerId)
      : [...section.participant_ids, playerId]
    onChange({ ...section, participant_ids: next })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/30 border-b border-border/40">
        <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
          #{index + 1}
        </span>
        <Input
          value={section.label}
          onChange={(e) => onChange({ ...section, label: e.target.value })}
          placeholder={`Phần ${index + 1}`}
          disabled={disabled}
          className="h-8 text-xs flex-1 border-none bg-transparent focus-visible:ring-1 px-2"
        />
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full text-muted-foreground hover:text-destructive shrink-0"
            aria-label="Xoá phần này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-4">
        <Tabs
          value={section.mode}
          onValueChange={(v) => {
            if (disabled) return
            onChange({ ...section, mode: v as typeof section.mode })
          }}
        >
          <TabsList className="w-full grid grid-cols-2 h-8 bg-secondary/50">
            <TabsTrigger
              value="split_evenly"
              disabled={disabled}
              className="h-6 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Chia đều
            </TabsTrigger>
            <TabsTrigger
              value="fixed_price"
              disabled={disabled}
              className="h-6 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Thu cố định
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ExpenseLinesEditor
          lines={section.expense_lines}
          onLinesChange={(expense_lines) => onChange({ ...section, expense_lines })}
          disabled={disabled}
          total={expenseTotal}
        />

        <div>
          <p className="text-[11px] font-semibold text-foreground mb-1.5">
            Người chơi phần này ({section.participant_ids.length}/{allPlayers.length})
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {allPlayers.map((p) => {
              const checked = participantIdSet.has(p.id)
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-border/40 px-2 py-1.5 cursor-pointer text-xs",
                    checked ? "bg-primary/5 border-primary/40" : "bg-secondary/20",
                    disabled && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleParticipant(p.id)}
                    disabled={disabled}
                    className="shrink-0"
                  />
                  <span className="truncate">{p.name || `#${p.id}`}</span>
                </label>
              )
            })}
          </div>
        </div>

        {section.mode === "split_evenly" ? (
          hasBothGenders && (
            <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-foreground mb-1">Giá mong muốn cho nữ</p>
              <p className="text-[10px] text-muted-foreground mb-2">
                Để trống = chia đều. Nhập giá để giảm cho nữ — nam tự bù phần còn lại, làm tròn lên 500đ.
              </p>
              <SettlementThousandsInput
                valueVnd={section.desired_female_price}
                onChangeVnd={(vnd) =>
                  onChange({ ...section, desired_female_price: Math.max(0, vnd) })
                }
                disabled={disabled}
              />
              {isUsingDefault && equalSplitPrice > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Mặc định chia đều: {formatVnd(equalSplitPrice)}/người
                </p>
              )}
              {!isUsingDefault && computed?.male_unit != null && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  → Nam {formatVnd(computed.male_unit)}/người
                  {computed.male_unit === 0 ? " (miễn phí — nữ cover đủ chi)" : ""}
                </p>
              )}
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Giá thu / nam (nghìn)</Label>
              <SettlementThousandsInput
                valueVnd={section.fixed_male_price}
                onChangeVnd={(fixed_male_price) => onChange({ ...section, fixed_male_price })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Giá thu / nữ (nghìn)</Label>
              <SettlementThousandsInput
                valueVnd={section.fixed_female_price}
                onChangeVnd={(fixed_female_price) => onChange({ ...section, fixed_female_price })}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        {computed && computed.per_player.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border/30 text-[10px] font-semibold text-muted-foreground">
              Phần này: {formatVnd(computed.total_expense)} chi · {formatVnd(computed.revenue)} thu
            </div>
            <div className="divide-y divide-border/20">
              {computed.per_player.map((p) => (
                <div key={p.id} className="flex justify-between px-3 py-1.5 text-xs">
                  <span className="truncate">{p.name || `#${p.id}`}</span>
                  <span className="font-medium tabular-nums">{formatVnd(p.amount)}</span>
                </div>
              ))}
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full h-7 text-[11px] text-muted-foreground"
          disabled={disabled || allPlayers.length === 0}
          onClick={() =>
            onChange({
              ...section,
              participant_ids: allPlayers.map((p) => p.id),
            })
          }
        >
          Chọn tất cả người đã đến
        </Button>
      </div>
    </div>
  )
}
