import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return formatDistanceToNow(date, { addSuffix: true, locale: vi })
}
