export interface RadarPoint {
  x: number
  y: number
}

export const RADAR_CENTER = 160
export const RADAR_RADIUS = 105
export const RADAR_AXIS_COUNT = 6

export function clampScore(score: number) {
  return Math.min(10, Math.max(1, Math.round(score)))
}

export function axisUnit(axisIndex: number): RadarPoint {
  const angle = -Math.PI / 2 + (axisIndex * Math.PI * 2) / RADAR_AXIS_COUNT
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

export function pointForScore(axisIndex: number, score: number): RadarPoint {
  const unit = axisUnit(axisIndex)
  const distance = (clampScore(score) / 10) * RADAR_RADIUS

  return {
    x: RADAR_CENTER + unit.x * distance,
    y: RADAR_CENTER + unit.y * distance,
  }
}

export function pointForRadius(axisIndex: number, radius: number): RadarPoint {
  const unit = axisUnit(axisIndex)
  return {
    x: RADAR_CENTER + unit.x * radius,
    y: RADAR_CENTER + unit.y * radius,
  }
}

export function scoreFromPoint(axisIndex: number, point: RadarPoint) {
  const unit = axisUnit(axisIndex)
  const projectedDistance = (point.x - RADAR_CENTER) * unit.x + (point.y - RADAR_CENTER) * unit.y

  return clampScore((projectedDistance / RADAR_RADIUS) * 10)
}

export function nearestAxisIndex(point: RadarPoint) {
  const offset = { x: point.x - RADAR_CENTER, y: point.y - RADAR_CENTER }
  let closestAxis = 0
  let closestProjection = Number.NEGATIVE_INFINITY

  for (let axisIndex = 0; axisIndex < RADAR_AXIS_COUNT; axisIndex += 1) {
    const unit = axisUnit(axisIndex)
    const projection = offset.x * unit.x + offset.y * unit.y
    if (projection > closestProjection) {
      closestProjection = projection
      closestAxis = axisIndex
    }
  }

  return closestAxis
}
