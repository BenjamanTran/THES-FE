"use client"

import { Settings, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditProfileSheet } from "./edit-profile-sheet"
import { ProfileGuestView } from "./profile/profile-guest-view"
import { ProfileHeader } from "./profile/profile-header"
import { ProfileEmailVerification } from "./profile/profile-email-verification"
import { ProfilePersonalInfoCard } from "./profile/profile-personal-info-card"
import { ProfileGuestUpgrade } from "./profile/profile-guest-upgrade"
import { ProfileSkillStatsCard } from "./profile/profile-skill-stats-card"
import { ProfileMockSections } from "./profile/profile-mock-sections"
import { useProfileScreen } from "./profile/use-profile-screen"
import { userStatsMock } from "./profile/mock-data"

export function ProfileScreen() {
  const {
    user,
    loggingOut,
    editOpen,
    setEditOpen,
    upgradeEmail,
    setUpgradeEmail,
    upgradePassword,
    setUpgradePassword,
    upgradeConfirm,
    setUpgradeConfirm,
    upgrading,
    upgradeError,
    showUpgradeForm,
    setShowUpgradeForm,
    resendingVerify,
    verifyMessage,
    handleResendVerification,
    handleUpgrade,
    handleLogout,
  } = useProfileScreen()

  if (!user) {
    return <ProfileGuestView />
  }

  const userStats = { ...userStatsMock, name: user.name, email: user.email }
  const declaredRank = user.declared_rank ?? user.rank
  const matchStats = user.rank
  const apiStats = user.stats

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Hồ sơ</h1>
          <Button variant="ghost" size="icon" className="rounded-full" disabled>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
        <ProfileHeader user={user} onEdit={() => setEditOpen(true)} />

        {!user.guest && user.email && user.email_verified === false && (
          <ProfileEmailVerification
            verifyMessage={verifyMessage}
            resendingVerify={resendingVerify}
            onResend={handleResendVerification}
          />
        )}

        <ProfilePersonalInfoCard
          user={user}
          declaredRank={declaredRank}
          onEdit={() => setEditOpen(true)}
        />

        {user.guest && (
          <ProfileGuestUpgrade
            showUpgradeForm={showUpgradeForm}
            setShowUpgradeForm={setShowUpgradeForm}
            upgradeEmail={upgradeEmail}
            setUpgradeEmail={setUpgradeEmail}
            upgradePassword={upgradePassword}
            setUpgradePassword={setUpgradePassword}
            upgradeConfirm={upgradeConfirm}
            setUpgradeConfirm={setUpgradeConfirm}
            upgradeError={upgradeError}
            upgrading={upgrading}
            onSubmit={handleUpgrade}
          />
        )}

        <ProfileSkillStatsCard
          declaredRank={declaredRank}
          apiStats={apiStats}
          matchStats={matchStats}
        />

        <ProfileMockSections userStats={userStats} />

        <div className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Đăng xuất
          </Button>
        </div>
      </div>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
