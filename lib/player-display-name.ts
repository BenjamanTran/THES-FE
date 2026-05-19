/** Full display name for rosters, match lines, and suggestions. */
export function playerDisplayName(name: string | null | undefined, id: number): string {
  const trimmed = name?.trim()
  return trimmed || `#${id}`
}

/** Single initial for avatars (last word of name). */
export function playerAvatarInitial(name: string | null | undefined): string {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1] || name
  return last.charAt(0).toUpperCase()
}
