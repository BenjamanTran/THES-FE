"use client"

import { ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileGuestUpgradeProps {
  showUpgradeForm: boolean
  setShowUpgradeForm: (v: boolean) => void
  upgradeEmail: string
  setUpgradeEmail: (v: string) => void
  upgradePassword: string
  setUpgradePassword: (v: string) => void
  upgradeConfirm: string
  setUpgradeConfirm: (v: string) => void
  upgradeError: string | null
  upgrading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function ProfileGuestUpgrade({showUpgradeForm, setShowUpgradeForm, upgradeEmail, setUpgradeEmail, upgradePassword, setUpgradePassword, upgradeConfirm, setUpgradeConfirm, upgradeError, upgrading, onSubmit}: ProfileGuestUpgradeProps) {
  return (
          <div className="px-4 pb-4">
            <Card className="p-4 rounded-2xl border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400 mb-0.5">Tài khoản khách</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Đặt email & mật khẩu để bảo vệ tài khoản và đăng nhập lại sau.
                  </p>
                  {!showUpgradeForm ? (
                    <Button
                      size="sm"
                      className="rounded-full text-xs h-7"
                      onClick={() => setShowUpgradeForm(true)}
                    >
                      Nâng cấp tài khoản
                    </Button>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-email" className="text-xs">Email</Label>
                        <Input
                          id="upgrade-email"
                          type="email"
                          required
                          value={upgradeEmail}
                          onChange={(e) => setUpgradeEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-pass" className="text-xs">Mật khẩu</Label>
                        <Input
                          id="upgrade-pass"
                          type="password"
                          required
                          minLength={8}
                          value={upgradePassword}
                          onChange={(e) => setUpgradePassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="upgrade-confirm" className="text-xs">Xác nhận mật khẩu</Label>
                        <Input
                          id="upgrade-confirm"
                          type="password"
                          required
                          minLength={8}
                          value={upgradeConfirm}
                          onChange={(e) => setUpgradeConfirm(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                      {upgradeError && (
                        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                          {upgradeError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs flex-1"
                          onClick={() => setShowUpgradeForm(false)}
                          disabled={upgrading}
                        >
                          Huỷ
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="rounded-full text-xs flex-1"
                          disabled={upgrading}
                        >
                          {upgrading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          Lưu
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          </div>
  )
}
