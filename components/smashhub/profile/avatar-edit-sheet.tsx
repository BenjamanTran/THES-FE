"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "../user-avatar"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"

const ACCEPT = "image/jpeg,image/png,image/webp"
const MAX_BYTES = 5 * 1024 * 1024

interface AvatarEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AvatarEditSheet({ open, onOpenChange }: AvatarEditSheetProps) {
  const { user, uploadAvatar, deleteAvatar } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resetSelection = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetSelection()
      setError(null)
    }
    onOpenChange(next)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_BYTES) {
      setError("Ảnh quá lớn (tối đa 5MB)")
      return
    }

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSave = async () => {
    if (!pendingFile) {
      setError("Hãy chọn ảnh trước")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await uploadAvatar(pendingFile)
      resetSelection()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tải ảnh thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const onRemove = async () => {
    if (!user?.avatar_url) return
    setError(null)
    setDeleting(true)
    try {
      await deleteAvatar()
      resetSelection()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xóa ảnh thất bại")
    } finally {
      setDeleting(false)
    }
  }

  if (!user) return null

  const displayUrl = previewUrl ?? user.avatar_url ?? null
  const busy = submitting || deleting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Ảnh đại diện</SheetTitle>
          <SheetDescription>Ảnh sẽ được tối ưu WebP và lưu trên cloud.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <UserAvatar
            name={user.name}
            avatarUrl={displayUrl}
            className="w-28 h-28 ring-4 ring-primary/30"
            fallbackClassName="text-3xl"
          />

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              {pendingFile ? "Chọn ảnh khác" : "Chọn ảnh"}
            </Button>

            {user.avatar_url && !pendingFile && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-destructive/40 text-destructive"
                disabled={busy}
                onClick={onRemove}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Xóa ảnh
              </Button>
            )}
          </div>

          {pendingFile && (
            <Button className="w-full rounded-full" disabled={busy} onClick={onSave}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Lưu ảnh đại diện
            </Button>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
