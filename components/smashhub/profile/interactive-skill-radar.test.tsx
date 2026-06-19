// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SKILL_SCORES } from "@/lib/skill-radar"
import { InteractiveSkillRadar } from "./interactive-skill-radar"

const rect = {
  bottom: 320,
  height: 320,
  left: 0,
  right: 320,
  top: 0,
  width: 320,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("InteractiveSkillRadar", () => {
  it("renders six accessible handles with default score five", () => {
    render(<InteractiveSkillRadar scores={DEFAULT_SKILL_SCORES} onChange={vi.fn()} />)

    const handles = screen.getAllByRole("slider")
    expect(handles).toHaveLength(6)
    expect(handles.every((handle) => handle.getAttribute("aria-valuenow") === "5")).toBe(true)
    expect(screen.getByRole("slider", { name: "Kỹ thuật" })).toBeTruthy()
  })

  it("updates one selected axis throughout a drag", () => {
    vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue(rect)
    const onChange = vi.fn()
    render(<InteractiveSkillRadar scores={DEFAULT_SKILL_SCORES} onChange={onChange} />)
    const radar = screen.getByLabelText("Điều chỉnh kỹ năng trên biểu đồ radar")

    fireEvent.pointerDown(radar, { clientX: 160, clientY: 107, pointerId: 1 })
    fireEvent.pointerMove(radar, { clientX: 160, clientY: 55, pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith("attack", 10)
    fireEvent.pointerUp(radar, { pointerId: 1 })
  })

  it("sets the nearest axis when the user taps the radar", () => {
    vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue(rect)
    const onChange = vi.fn()
    render(<InteractiveSkillRadar scores={DEFAULT_SKILL_SCORES} onChange={onChange} />)
    const radar = screen.getByLabelText("Điều chỉnh kỹ năng trên biểu đồ radar")

    fireEvent.pointerDown(radar, { clientX: 233, clientY: 202, pointerId: 2 })
    expect(onChange).toHaveBeenLastCalledWith("technique", 8)
  })

  it("supports arrow, Home, and End keys on each handle", () => {
    const onChange = vi.fn()
    render(<InteractiveSkillRadar scores={DEFAULT_SKILL_SCORES} onChange={onChange} />)
    const attack = screen.getByRole("slider", { name: "Tấn công" })

    fireEvent.keyDown(attack, { key: "ArrowUp" })
    expect(onChange).toHaveBeenLastCalledWith("attack", 6)
    fireEvent.keyDown(attack, { key: "Home" })
    expect(onChange).toHaveBeenLastCalledWith("attack", 1)
    fireEvent.keyDown(attack, { key: "End" })
    expect(onChange).toHaveBeenLastCalledWith("attack", 10)
  })
})
