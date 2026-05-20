"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { resendVerificationEmail, upgradeGuest } from "@/lib/api"

export function useProfileScreen() {
  const { user, logout, refresh } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState("")
  const [upgradePassword, setUpgradePassword] = useState("")
  const [upgradeConfirm, setUpgradeConfirm] = useState("")
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const [resendingVerify, setResendingVerify] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)

  const handleResendVerification = async () => {
    setVerifyMessage(null)
    setResendingVerify(true)
    try {
      const res = await resendVerificationEmail()
      setVerifyMessage(res.message)
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Gửi email thất bại")
    } finally {
      setResendingVerify(false)
    }
  }

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (upgradePassword !== upgradeConfirm) {
      setUpgradeError("Mật khẩu xác nhận không khớp")
      return
    }
    setUpgradeError(null)
    setUpgrading(true)
    try {
      await upgradeGuest({
        email: upgradeEmail.trim(),
        password: upgradePassword,
        password_confirmation: upgradeConfirm,
      })
      await refresh()
      setShowUpgradeForm(false)
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Nâng cấp thất bại")
    } finally {
      setUpgrading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return {
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
  }
}
