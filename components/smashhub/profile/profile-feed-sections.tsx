"use client"

import type { UserProfile } from "@/lib/api"
import { ProfileAchievementsSection } from "./profile-achievements-section"
import { ProfileActivitySection } from "./profile-activity-section"

export function ProfileFeedSections({ profile }: { profile?: UserProfile }) {
  if (!profile) return null

  return (
    <>
      <ProfileAchievementsSection achievements={profile.achievements} />
      <ProfileActivitySection activities={profile.recent_activity} />
    </>
  )
}
