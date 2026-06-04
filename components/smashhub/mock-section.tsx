import type { ReactNode } from "react"

interface MockSectionProps {
  children: ReactNode
  label?: string
}

/**
 * Marks a UI block as mocked data (not yet wired to a real API).
 * Renders the block dimmed + grayscale + a demo-data pill for easy audit later.
 */
export function MockSection({ children, label = "Dữ liệu demo" }: MockSectionProps) {
  return (
    <div className="relative" aria-label={`${label} - not wired to live API`}>
      <span className="absolute -top-2 right-4 z-20 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-dashed border-border/60">
        {label}
      </span>
      <div className="opacity-40 grayscale pointer-events-none select-none">
        {children}
      </div>
    </div>
  )
}
