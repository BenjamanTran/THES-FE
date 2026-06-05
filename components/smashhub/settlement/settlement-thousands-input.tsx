"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  sanitizeThousandsInput,
  thousandsFieldToVnd,
  vndToThousandsField,
} from "@/lib/settlement/settlement-amount"

interface SettlementThousandsInputProps {
  valueVnd: number
  onChangeVnd: (vnd: number) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function SettlementThousandsInput({
  valueVnd,
  onChangeVnd,
  disabled,
  className,
  placeholder = "0",
}: SettlementThousandsInputProps) {
  const [text, setText] = useState(() => vndToThousandsField(valueVnd))
  const editingRef = useRef(false)

  useEffect(() => {
    if (editingRef.current) return
    setText(vndToThousandsField(valueVnd))
  }, [valueVnd])

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          editingRef.current = true
          const next = sanitizeThousandsInput(e.target.value)
          setText(next)
          onChangeVnd(thousandsFieldToVnd(next))
        }}
        onBlur={() => {
          editingRef.current = false
          const vnd = thousandsFieldToVnd(text)
          const normalized = vndToThousandsField(vnd)
          setText(normalized)
          if (vnd !== valueVnd) onChangeVnd(vnd)
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 text-xs pr-9 tabular-nums"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-muted-foreground">
        K
      </span>
    </div>
  )
}
