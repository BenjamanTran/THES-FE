"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BottomNav, type AppTab } from "@/components/smashhub/bottom-nav"
import { DesktopSidebar } from "@/components/smashhub/desktop-sidebar"
import { DesktopDemoPanel } from "@/components/smashhub/desktop-demo-panel"
import { HomeScreen } from "@/components/smashhub/home-screen"
import { MapScreen } from "@/components/smashhub/map-screen"
import { MatchesScreen } from "@/components/smashhub/matches-screen"
import { MyGamesScreen } from "@/components/smashhub/my-games-screen"
import { ProfileScreen } from "@/components/smashhub/profile-screen"
import { CreateMatchModal } from "@/components/smashhub/create-match-modal"
import { GameDetailScreen } from "@/components/smashhub/game-detail-screen"
import { useAuth, useRequireAuth } from "@/lib/auth-context"

function HomeLoading() {
  return (
    <div className="min-h-[100dvh] bg-background px-4 pt-16 space-y-4 animate-skeleton">
      <div className="h-14 rounded-2xl bg-muted/30" />
      <div className="h-32 rounded-2xl bg-muted/30" />
      <div className="h-48 rounded-2xl bg-muted/30" />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <SmashHubPro />
    </Suspense>
  )
}

function SmashHubPro() {
  const { loading } = useAuth()
  const requireAuth = useRequireAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<AppTab>("home")
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [displayTab, setDisplayTab] = useState<AppTab>(activeTab)
  const prevTab = useRef(activeTab)

  useEffect(() => {
    const gameParam = searchParams.get("game")
    if (gameParam) {
      const id = Number(gameParam)
      if (id > 0) setSelectedGameId(id)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab !== prevTab.current) {
      setTransitioning(true)
      const t = setTimeout(() => {
        setDisplayTab(activeTab)
        prevTab.current = activeTab
        setTransitioning(false)
      }, 120)
      return () => clearTimeout(t)
    }
  }, [activeTab])

  const openGameDetail = (id: number) => setSelectedGameId(id)
  const closeGameDetail = () => setSelectedGameId(null)
  const handleGameChanged = () => setRefreshKey((k) => k + 1)

  const handleCreateMatch = () => {
    if (!requireAuth()) return
    setShowCreateMatch(true)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background px-4 pt-16 space-y-4 animate-skeleton">
        <div className="h-14 rounded-2xl bg-muted/30" />
        <div className="h-32 rounded-2xl bg-muted/30" />
        <div className="h-48 rounded-2xl bg-muted/30" />
      </div>
    )
  }

  const renderScreen = () => {
    switch (displayTab) {
      case "home":
        return (
          <HomeScreen
            key={`home-${refreshKey}`}
            onCreateMatch={handleCreateMatch}
            onNavigate={setActiveTab}
            onOpenGame={openGameDetail}
          />
        )
      case "map":
        return <MapScreen key={`map-${refreshKey}`} onOpenGame={openGameDetail} />
      case "matches":
        return (
          <MatchesScreen
            key={`matches-${refreshKey}`}
            onCreateMatch={handleCreateMatch}
            onOpenGame={openGameDetail}
          />
        )
      case "my_games":
        return (
          <MyGamesScreen
            key={`my-games-${refreshKey}`}
            onCreateMatch={handleCreateMatch}
            onOpenGame={openGameDetail}
          />
        )
      case "profile":
        return <ProfileScreen />
    }
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-background relative overflow-hidden">
        <main className="h-[100dvh] overflow-y-auto pb-24">
          <div
            className="transition-opacity duration-150 ease-out h-full"
            style={{ opacity: transitioning ? 0 : 1 }}
          >
            {renderScreen()}
          </div>
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        {/* Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreateMatch={handleCreateMatch}
        />

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          {/* Phone Mockup */}
          <div className="relative">
            {/* Phone Frame */}
            <div className="relative w-[390px] h-[844px] bg-background rounded-[3rem] border-[14px] border-neutral-800 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Screen Content */}
              <div className="h-full overflow-y-auto">
                <div
                  className="transition-opacity duration-150 ease-out h-full"
                  style={{ opacity: transitioning ? 0 : 1 }}
                >
                  {renderScreen()}
                </div>
              </div>
            </div>
            
            {/* Reflection effect */}
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          </div>
        </div>

        <DesktopDemoPanel />
      </div>

      {/* Create Match Modal */}
      <CreateMatchModal
        open={showCreateMatch}
        onOpenChange={setShowCreateMatch}
        onSuccess={handleGameChanged}
      />

      {/* Game Detail Screen */}
      <GameDetailScreen
        gameId={selectedGameId}
        onClose={closeGameDetail}
        onChanged={handleGameChanged}
      />
    </>
  )
}
