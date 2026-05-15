"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BottomNav, type AppTab } from "@/components/smashhub/bottom-nav"
import { DesktopSidebar } from "@/components/smashhub/desktop-sidebar"
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

        {/* Desktop Side Panel - Quick Stats */}
        <div className="w-80 p-8 flex flex-col gap-6">
          <div className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 border border-neutral-800">
            <h3 className="text-lg font-bold text-foreground mb-4">Thống kê nhanh</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trận đấu hôm nay</span>
                <span className="font-bold text-primary">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Người chơi online</span>
                <span className="font-bold text-emerald-400">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sân trống gần đây</span>
                <span className="font-bold text-foreground">8</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-6 border border-neutral-800">
            <h3 className="text-lg font-bold text-foreground mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-sm text-foreground">Minh Quân đã tham gia trận của bạn</p>
                  <p className="text-xs text-muted-foreground">2 phút trước</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
                <div>
                  <p className="text-sm text-foreground">Bạn đã thắng 2 trận liên tiếp</p>
                  <p className="text-xs text-muted-foreground">1 giờ trước</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                <div>
                  <p className="text-sm text-foreground">Galaxy Badminton có sân trống</p>
                  <p className="text-xs text-muted-foreground">3 giờ trước</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl rounded-3xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🏆</div>
              <div>
                <h3 className="font-bold text-foreground">SmashHub Pro</h3>
                <p className="text-xs text-muted-foreground">Nâng cấp để mở khóa</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Phân tích chi tiết
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Ưu tiên đặt sân
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Badge độc quyền
              </li>
            </ul>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Nâng cấp ngay
            </button>
          </div>
        </div>
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
