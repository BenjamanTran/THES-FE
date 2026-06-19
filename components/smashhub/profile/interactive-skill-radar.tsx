"use client"

import { useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import type { SkillRadarAxisKey, SkillScores } from "@/lib/api"
import { SKILL_RADAR_AXES } from "@/lib/skill-radar"
import {
  axisUnit,
  clampScore,
  nearestAxisIndex,
  pointForRadius,
  pointForScore,
  RADAR_AXIS_COUNT,
  RADAR_CENTER,
  RADAR_RADIUS,
  scoreFromPoint,
  type RadarPoint,
} from "./interactive-skill-radar-geometry"

interface InteractiveSkillRadarProps {
  scores: SkillScores
  onChange: (key: SkillRadarAxisKey, score: number) => void
  disabled?: boolean
}

const GRID_SCORES = [2, 4, 6, 8, 10]
const LABEL_RADIUS = 139
const BADGE_OFFSET = 19

function pointsForScores(scores: SkillScores) {
  return SKILL_RADAR_AXES.map((axis, index) => {
    const point = pointForScore(index, scores[axis.key])
    return `${point.x},${point.y}`
  }).join(" ")
}

function gridPoints(score: number) {
  return Array.from({ length: RADAR_AXIS_COUNT }, (_, index) => {
    const point = pointForScore(index, score)
    return `${point.x},${point.y}`
  }).join(" ")
}

export function InteractiveSkillRadar({ scores, onChange, disabled = false }: InteractiveSkillRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const activeAxisRef = useRef<number | null>(null)
  const activePointerRef = useRef<number | null>(null)
  const [activeAxis, setActiveAxis] = useState<number | null>(null)

  const clientToRadarPoint = (clientX: number, clientY: number): RadarPoint | null => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null

    return {
      x: ((clientX - rect.left) / rect.width) * 320,
      y: ((clientY - rect.top) / rect.height) * 320,
    }
  }

  const updateFromPointer = (event: ReactPointerEvent<SVGSVGElement>, axisIndex?: number) => {
    const point = clientToRadarPoint(event.clientX, event.clientY)
    if (!point) return
    const nextAxis = axisIndex ?? nearestAxisIndex(point)
    const axis = SKILL_RADAR_AXES[nextAxis]
    onChange(axis.key, scoreFromPoint(nextAxis, point))
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const point = clientToRadarPoint(event.clientX, event.clientY)
    if (!point) return

    const axisIndex = nearestAxisIndex(point)
    activeAxisRef.current = axisIndex
    activePointerRef.current = event.pointerId
    setActiveAxis(axisIndex)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    updateFromPointer(event, axisIndex)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (disabled || activeAxisRef.current === null || activePointerRef.current !== event.pointerId) return
    event.preventDefault()
    updateFromPointer(event, activeAxisRef.current)
  }

  const finishPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    activeAxisRef.current = null
    activePointerRef.current = null
    setActiveAxis(null)
  }

  const handleKeyDown = (event: KeyboardEvent<SVGCircleElement>, axisIndex: number) => {
    if (disabled) return
    const axis = SKILL_RADAR_AXES[axisIndex]
    const current = scores[axis.key]
    const next = {
      ArrowUp: current + 1,
      ArrowRight: current + 1,
      ArrowDown: current - 1,
      ArrowLeft: current - 1,
      Home: 1,
      End: 10,
    }[event.key]

    if (next === undefined) return
    event.preventDefault()
    onChange(axis.key, clampScore(next))
  }

  return (
    <div className="mx-auto w-full max-w-[360px] select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 320 320"
        className="block h-auto w-full overflow-visible"
        style={{ touchAction: "none" }}
        aria-label="Điều chỉnh kỹ năng trên biểu đồ radar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        {GRID_SCORES.map((score) => (
          <polygon
            key={score}
            points={gridPoints(score)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={score === 10 ? 1.5 : 1}
          />
        ))}

        {SKILL_RADAR_AXES.map((axis, index) => {
          const edge = pointForRadius(index, RADAR_RADIUS)
          return (
            <line
              key={axis.key}
              x1={RADAR_CENTER}
              y1={RADAR_CENTER}
              x2={edge.x}
              y2={edge.y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={pointsForScores(scores)}
          fill="var(--primary)"
          fillOpacity="0.24"
          stroke="var(--primary)"
          strokeWidth="2.5"
          className="transition-[points] duration-100"
        />

        {SKILL_RADAR_AXES.map((axis, index) => {
          const score = scores[axis.key]
          const point = pointForScore(index, score)
          const unit = axisUnit(index)
          const badge = { x: point.x + unit.x * BADGE_OFFSET, y: point.y + unit.y * BADGE_OFFSET }
          const label = pointForRadius(index, LABEL_RADIUS)
          const isActive = activeAxis === index

          return (
            <g key={axis.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="22"
                fill="transparent"
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={axis.label}
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={score}
                aria-disabled={disabled || undefined}
                onFocus={() => setActiveAxis(index)}
                onBlur={() => setActiveAxis(null)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 8 : 7}
                fill="var(--background)"
                stroke="var(--primary)"
                strokeWidth={isActive ? 4 : 3}
                pointerEvents="none"
              />
              <circle
                cx={badge.x}
                cy={badge.y}
                r="11"
                fill="var(--background)"
                stroke="var(--primary)"
                strokeWidth="1.5"
                pointerEvents="none"
              />
              <text
                x={badge.x}
                y={badge.y}
                fill="var(--foreground)"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
                pointerEvents="none"
              >
                {score}
              </text>
              <text
                x={label.x}
                y={label.y}
                fill="var(--muted-foreground)"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="central"
                pointerEvents="none"
              >
                {axis.shortLabel}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="-mt-2 text-center text-[11px] text-muted-foreground">
        Chạm trên trục hoặc kéo từng đỉnh để chỉnh điểm
      </p>
    </div>
  )
}
