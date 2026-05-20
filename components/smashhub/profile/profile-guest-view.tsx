"use client"

import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProfileGuestView() {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <header className="glass-dark sticky top-0 z-40 px-4 pt-4 pb-3 safe-top border-b border-border/20">
        <h1 className="text-xl font-bold">Hồ sơ</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center text-4xl mb-4">
          🏸
        </div>
        <h2 className="text-lg font-bold mb-2">Chào mừng tới SmashHub</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Đăng nhập để tạo trận, tham gia trận khác và theo dõi lịch sử của bạn.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <Button className="w-full rounded-full" onClick={() => router.push("/login")}>
            <LogIn className="w-4 h-4 mr-2" />
            Đăng nhập
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => router.push("/signup")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tạo tài khoản mới
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-8">
          Bạn vẫn có thể xem trận trên các tab khác mà không cần đăng nhập.
        </p>
      </div>
    </div>
  )
}
