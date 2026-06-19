// @vitest-environment jsdom

import type { ReactNode } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditProfileSheet } from "./edit-profile-sheet"

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: () => <div role="slider" />,
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Người chơi",
      phone: null,
      gender: "unspecified",
      profile: { skill_radar: null },
      declared_rank: null,
      rank: null,
    },
    updateProfile: vi.fn(),
    updateSkillProfile: vi.fn(),
  }),
}))

afterEach(cleanup)

describe("EditProfileSheet skill editor", () => {
  it("uses the interactive radar instead of separate skill sliders", () => {
    render(<EditProfileSheet open onOpenChange={vi.fn()} />)

    expect(screen.getByLabelText("Điều chỉnh kỹ năng trên biểu đồ radar")).toBeTruthy()
    expect(screen.getAllByRole("slider")).toHaveLength(6)
  })
})
