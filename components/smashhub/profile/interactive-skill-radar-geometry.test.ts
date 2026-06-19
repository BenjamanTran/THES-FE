import { describe, expect, it } from "vitest"
import { nearestAxisIndex, pointForScore, scoreFromPoint } from "./interactive-skill-radar-geometry"

describe("interactive skill radar geometry", () => {
  it.each([
    [1, 10.5],
    [5, 52.5],
    [10, 105],
  ])("maps score %i to its radial distance", (score, distance) => {
    const point = pointForScore(0, score)

    expect(point.x).toBeCloseTo(160)
    expect(160 - point.y).toBeCloseTo(distance)
  })

  it("rounds and clamps pointer positions to integer scores", () => {
    expect(scoreFromPoint(0, { x: 160, y: 104 })).toBe(5)
    expect(scoreFromPoint(0, { x: 160, y: 250 })).toBe(1)
    expect(scoreFromPoint(0, { x: 160, y: -100 })).toBe(10)
  })

  it("selects the closest of six axes", () => {
    expect(nearestAxisIndex({ x: 160, y: 40 })).toBe(0)
    expect(nearestAxisIndex({ x: 240, y: 205 })).toBe(2)
    expect(nearestAxisIndex({ x: 70, y: 110 })).toBe(5)
  })
})
