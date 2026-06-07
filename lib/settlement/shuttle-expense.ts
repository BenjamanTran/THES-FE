export interface ShuttleSettings {
  name: string
  tube_vnd: number
  per_tube: number
}

/** Fields needed for shuttle line math (avoids circular import with settlement-math). */
export interface ShuttleLineShape {
  id: string
  label: string
  quantity: number
  unit_vnd: number
  amount: number
  included?: boolean
  kind?: "generic" | "shuttle"
  shuttle_tube_vnd?: number
  shuttle_per_tube?: number
}

export const DEFAULT_SHUTTLE_SETTINGS: ShuttleSettings = {
  name: "Cầu 88",
  tube_vnd: 325_000,
  per_tube: 12,
}

export function isShuttleLine(line: Pick<ShuttleLineShape, "kind" | "label">): boolean {
  if (line.kind === "shuttle") return true
  return /^cầu/i.test(line.label.trim())
}

export function perShuttleVnd(tubeVnd: number, perTube: number): number {
  if (perTube <= 0 || tubeVnd <= 0) return 0
  return Math.round(tubeVnd / perTube)
}

export function shuttleLineAmount(shuttles: number, tubeVnd: number, perTube: number): number {
  const q = Math.max(0, Math.floor(shuttles) || 0)
  if (q <= 0 || perTube <= 0 || tubeVnd <= 0) return 0
  return Math.round((q * tubeVnd) / perTube)
}

export function shuttleSettingsFromLine(line: ShuttleLineShape): ShuttleSettings {
  return {
    name: line.label.trim() || DEFAULT_SHUTTLE_SETTINGS.name,
    tube_vnd: line.shuttle_tube_vnd ?? DEFAULT_SHUTTLE_SETTINGS.tube_vnd,
    per_tube: line.shuttle_per_tube ?? DEFAULT_SHUTTLE_SETTINGS.per_tube,
  }
}

export function resolveShuttleSettings(
  draftSettings: ShuttleSettings | undefined,
  lines: ShuttleLineShape[],
): ShuttleSettings {
  if (draftSettings) return draftSettings
  const shuttleLine = lines.find(isShuttleLine)
  if (shuttleLine) return shuttleSettingsFromLine(shuttleLine)
  return DEFAULT_SHUTTLE_SETTINGS
}

export function newShuttleExpenseLine(settings: ShuttleSettings = DEFAULT_SHUTTLE_SETTINGS): ShuttleLineShape {
  return applyShuttleToLine(
    {
      id: crypto.randomUUID(),
      label: settings.name,
      quantity: 0,
      unit_vnd: 0,
      amount: 0,
      included: true,
      kind: "shuttle",
    },
    settings,
  )
}

export function applyShuttleToLine<T extends ShuttleLineShape>(
  line: T,
  settings: ShuttleSettings,
): T {
  const quantity = Math.max(0, Math.floor(line.quantity ?? 0))
  const tube_vnd = Math.max(0, settings.tube_vnd)
  const per_tube = Math.max(1, Math.floor(settings.per_tube) || DEFAULT_SHUTTLE_SETTINGS.per_tube)
  const unit_vnd = perShuttleVnd(tube_vnd, per_tube)
  const amount = shuttleLineAmount(quantity, tube_vnd, per_tube)
  return {
    ...line,
    kind: "shuttle",
    label: settings.name,
    quantity,
    shuttle_tube_vnd: tube_vnd,
    shuttle_per_tube: per_tube,
    unit_vnd,
    amount,
    included: line.included !== false,
  }
}

/** Cập nhật cài đặt cho một dòng cầu (không ảnh hưởng dòng khác). */
export function applyShuttleSettingsToLine<T extends ShuttleLineShape>(
  line: T,
  settings: ShuttleSettings,
): T {
  return applyShuttleToLine(line, settings)
}
