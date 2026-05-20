"use client"

import { Plus, Compass, Locate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useMatchesScreen } from "./use-matches-screen"
import { MatchesFiltersSheet } from "./matches-filters-sheet"
import { MatchesActiveFilterChips } from "./matches-active-filter-chips"
import { MatchesGameList } from "./matches-game-list"

interface MatchesScreenProps {
  onCreateMatch: () => void
  onOpenGame?: (id: number) => void
}

export function MatchesScreen({ onCreateMatch, onOpenGame }: MatchesScreenProps) {
  const { user } = useAuth()
  const vm = useMatchesScreen()
  const { geo, filters, total, activeFilterCount, locationStatusText } = vm

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Tìm trận
              {total !== null && (
                <span className="text-xs font-medium text-muted-foreground">
                  · {total} trận
                </span>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Locate className="w-3 h-3" />
              {locationStatusText}
              {filters.useLocation && (geo.status === "denied" || geo.status === "error") && (
                <button
                  type="button"
                  onClick={geo.request}
                  className="ml-1 text-primary font-medium underline-offset-2 hover:underline"
                >
                  Thử lại
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MatchesFiltersSheet vm={vm} />

            <Button size="sm" className="rounded-xl h-9" onClick={onCreateMatch}>
              <Plus className="w-4 h-4 mr-1" />
              Tạo trận
            </Button>
          </div>
        </div>

        {activeFilterCount > 0 && <MatchesActiveFilterChips vm={vm} />}
      </header>

      <MatchesGameList
        vm={vm}
        user={user}
        onCreateMatch={onCreateMatch}
        onOpenGame={onOpenGame}
      />
    </div>
  )
}
