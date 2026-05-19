"use client"

import type { ReactNode } from "react"
import { Sparkles } from "lucide-react"

function DemoCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-3xl p-6 border border-border bg-card ${className}`}>
      <span className="absolute top-3 right-3 z-10 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium">
        Demo
      </span>
      {children}
    </div>
  )
}

export function DesktopDemoPanel() {
  return (
    <aside className="w-80 p-8 flex flex-col gap-6 shrink-0 border-l border-sidebar-border bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
          <Sparkles className="w-3 h-3" />
          Tính năng demo
        </span>
        <p className="text-xs text-muted-foreground mt-2">Dữ liệu mẫu — chưa kết nối API thật</p>
      </div>

      <DemoCard>
        <h3 className="text-lg font-bold text-foreground mb-4 pr-14">Thống kê nhanh</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trận đấu hôm nay</span>
            <span className="font-bold text-primary">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Người chơi online</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">1,247</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sân trống gần đây</span>
            <span className="font-bold text-foreground">8</span>
          </div>
        </div>
      </DemoCard>

      <DemoCard>
        <h3 className="text-lg font-bold text-foreground mb-4 pr-14">Hoạt động gần đây</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
            <div>
              <p className="text-sm text-foreground">Minh Quân đã tham gia trận của bạn</p>
              <p className="text-xs text-muted-foreground">2 phút trước</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-2 shrink-0" />
            <div>
              <p className="text-sm text-foreground">Bạn đã thắng 2 trận liên tiếp</p>
              <p className="text-xs text-muted-foreground">1 giờ trước</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 shrink-0" />
            <div>
              <p className="text-sm text-foreground">Galaxy Badminton có sân trống</p>
              <p className="text-xs text-muted-foreground">3 giờ trước</p>
            </div>
          </div>
        </div>
      </DemoCard>

      <DemoCard className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/25">
        <div className="flex items-center gap-3 mb-3 pr-12">
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
        <button
          type="button"
          className="w-full py-2 bg-primary text-primary-foreground rounded-xl font-semibold opacity-90 pointer-events-none"
          tabIndex={-1}
        >
          Nâng cấp ngay
        </button>
      </DemoCard>
    </aside>
  )
}
