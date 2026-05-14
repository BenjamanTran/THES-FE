# Frontend (Next.js 16)

React 19 | TypeScript 5.7 (strict) | pnpm | shadcn/ui (new-york) | Tailwind v4

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev --port 3001      # Start dev server
pnpm build                # Production build (standalone output)
pnpm lint                 # ESLint
```

## Project structure

```
app/
  layout.tsx          Root layout (AuthProvider, Lexend font, dark mode default)
  page.tsx            Main app (SmashHub Pro dashboard)
  login/page.tsx      Login form
  signup/page.tsx     Registration form
components/
  smashhub/           Feature components (16 files: home, matches, map, profile...)
  ui/                 shadcn/ui components (75+ files)
hooks/
  use-games.ts        Game data fetching
  use-geolocation.ts  Browser geolocation
  use-mobile.ts       Mobile breakpoint detection
  use-toast.ts        Toast notifications
lib/
  api.ts              API client
  auth-context.tsx    Auth state (Context API, wraps entire app)
  format.ts           Data formatting
  geocode.ts          Geocoding utilities
  utils.ts            General utils (cn helper, etc.)
```

## UI conventions

- **Component library:** shadcn/ui (new-york style, RSC enabled)
- **Icons:** lucide-react
- **Path alias:** `@/*` maps to project root (e.g. `@/components/ui/button`)
- **Theme:** Custom oklch color variables in `globals.css`, primary = Smash Orange (#FF6B00)
- **Dark mode:** Enabled by default (`className="dark"` on html)
- **Font:** Lexend (Google Fonts)
- **Maps:** Mapbox GL (`mapbox-gl`, `mapbox-3d-map.tsx`)
- **Forms:** react-hook-form + zod validation
- **Toasts:** sonner

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add <component-name>
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token |

## Build & Deploy

- Output mode: `standalone` (optimized for Docker/Cloud Run)
- `typescript.ignoreBuildErrors: true` in next.config.mjs
- Docker: multi-stage build (node:20-alpine), production runs as `nextjs` user on port 3000
- Dev Docker: node:22-alpine, port 3001
