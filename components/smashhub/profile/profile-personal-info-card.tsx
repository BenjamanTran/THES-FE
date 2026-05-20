"use client"

import { User as UserIcon, Award, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProfileRow } from "./profile-row"
import { GENDER_LABEL } from "./mock-data"

interface ProfilePersonalInfoCardProps {
  user: import("@/lib/api").AuthUser
  declaredRank: import("@/lib/api").AuthUser["declared_rank"]
  onEdit: () => void
}

export function ProfilePersonalInfoCard({user, declaredRank, onEdit}: ProfilePersonalInfoCardProps) {
  return (
        <div className="px-4 pb-4">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
              <h3 className="text-sm font-semibold">Thông tin cá nhân</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-primary text-xs"
                onClick={onEdit}
              >
                Sửa
              </Button>
            </div>
            <ul className="divide-y divide-border/40">
              <ProfileRow
                icon={<UserIcon className="w-4 h-4" />}
                label="Giới tính"
                value={GENDER_LABEL[user.gender] || GENDER_LABEL.unspecified}
              />
              <ProfileRow
                icon={<Award className="w-4 h-4" />}
                label="Trình độ"
                value={declaredRank?.display_name || "Chưa khai báo"}
                muted={!declaredRank}
              />
              <ProfileRow
                icon={<Phone className="w-4 h-4" />}
                label="Số điện thoại"
                value={user.phone || "Chưa cập nhật"}
                muted={!user.phone}
              />
            </ul>
          </Card>
        </div>
  )
}
