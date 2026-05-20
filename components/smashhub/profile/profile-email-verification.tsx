"use client"

import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ProfileEmailVerificationProps {
  verifyMessage: string | null
  resendingVerify: boolean
  onResend: () => void
}

export function ProfileEmailVerification({verifyMessage, resendingVerify, onResend}: ProfileEmailVerificationProps) {
  return (
          <div className="px-4 pb-4">
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400 mb-0.5">Email chưa xác minh</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Tài khoản chưa xác minh email sẽ bị xóa sau 30 ngày. Vui lòng kiểm tra hộp thư và
                    nhấn link xác minh.
                  </p>
                  {verifyMessage && (
                    <p className="text-xs text-muted-foreground mb-2">{verifyMessage}</p>
                  )}
                  <Button
                    size="sm"
                    className="rounded-full text-xs h-7"
                    onClick={onResend}
                    disabled={resendingVerify}
                  >
                    {resendingVerify && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                    Gửi email xác minh
                  </Button>
                </div>
              </div>
            </Card>
          </div>
  )
}
