"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { flushSync } from "react-dom"

/** `light` uses the high-contrast `.outdoor` palette in globals.css */
export type AppTheme = "light" | "dark"

const STORAGE_KEY = "smashhub-theme"
const THEME_COLOR = { light: "#fafafa", dark: "#1a1a1a" } as const
const TRANSITION_MS = 420

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function updateThemeColor(theme: AppTheme) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", THEME_COLOR[theme])
}

function applyThemeClasses(theme: AppTheme) {
  const root = document.documentElement
  root.classList.remove("dark", "outdoor")
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.add("outdoor")
  }
  updateThemeColor(theme)
}

function parseStoredTheme(raw: string | null): AppTheme {
  if (raw === "dark") return "dark"
  return "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light")
  const themeRef = useRef<AppTheme>("light")
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add("no-theme-transition")

    const stored = localStorage.getItem(STORAGE_KEY)
    const initial = parseStoredTheme(stored)
    themeRef.current = initial
    setThemeState(initial)
    applyThemeClasses(initial)

    const id = requestAnimationFrame(() => {
      root.classList.remove("no-theme-transition")
    })
    return () => {
      cancelAnimationFrame(id)
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    }
  }, [])

  const setTheme = useCallback((next: AppTheme) => {
    if (themeRef.current === next) return

    const root = document.documentElement
    const commit = () => {
      themeRef.current = next
      localStorage.setItem(STORAGE_KEY, next)
      applyThemeClasses(next)
      setThemeState(next)
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    if (prefersReducedMotion()) {
      flushSync(commit)
      return
    }

    root.classList.add("theme-transition")
    flushSync(commit)

    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove("theme-transition")
      transitionTimerRef.current = null
    }, TRANSITION_MS)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider")
  return ctx
}
