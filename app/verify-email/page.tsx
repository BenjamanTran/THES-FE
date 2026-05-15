"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resendVerificationEmail, verifyEmail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token");
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(token ? "loading" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        await refresh();
        setStatus("success");
        setMessage(res.message);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Xác minh thất bại");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refresh]);

  const onResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      const res = await resendVerificationEmail();
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gửi lại email thất bại");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-sm rounded-3xl border-border/50 p-6 text-center space-y-4">
        <img src="/logo.webp" alt="SmashHub" className="w-12 h-12 rounded-2xl mx-auto" />

        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang xác minh email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-sm">{message || "Email đã được xác minh."}</p>
            <Button className="rounded-full" onClick={() => router.replace("/")}>
              Vào ứng dụng
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-destructive">{message}</p>
            {user && !user.email_verified && (
              <Button variant="outline" className="rounded-full" onClick={onResend} disabled={resending}>
                {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gửi lại email xác minh
              </Button>
            )}
            <Link href="/login" className="text-xs text-primary block hover:underline">
              Đăng nhập
            </Link>
          </>
        )}

        {status === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              {user?.email_verified
                ? "Email của bạn đã được xác minh."
                : "Kiểm tra hộp thư và nhấn link xác minh trong email."}
            </p>
            {user && !user.email_verified && (
              <Button variant="outline" className="rounded-full" onClick={onResend} disabled={resending}>
                {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gửi lại email xác minh
              </Button>
            )}
            {message && <p className="text-xs text-muted-foreground">{message}</p>}
            <Button className="rounded-full" onClick={() => router.replace("/")}>
              Tiếp tục
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
