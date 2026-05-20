import type { Game } from "@/lib/api"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export function formatTime(game: Game) {
  const start = new Date(game.start_time)
  const end = new Date(game.end_time)
  return {
    date: format(start, "EEE, dd/MM", { locale: vi }),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
  }
}
