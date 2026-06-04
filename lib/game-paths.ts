/** Home URL with game detail sheet open (shareable / post-login redirect). */
export function gameDetailPath(gameId: number): string {
  return `/?game=${gameId}`
}

/** After auth, prefer live host/co-host game when landing on home. */
export function resolvePostAuthPath(
  next: string,
  activeManageGameId?: number | null,
): string {
  const normalized = next || "/"
  if (activeManageGameId && (normalized === "/" || normalized === "")) {
    return gameDetailPath(activeManageGameId)
  }
  return normalized
}
