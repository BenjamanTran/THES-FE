"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-sm rounded-3xl border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.webp" alt="SmashHub" className="w-12 h-12 rounded-2xl" />
          <div>
            <h1 className="text-xl font-bold">Tạo tài khoản</h1>
            <p className="text-xs text-muted-foreground">Tham gia cộng đồng cầu lông</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Tên hiển thị
            </Label>
            <Input
              id="name"
              required
              maxLength={80}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nguyễn Văn A"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="your@email.com"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation" className="text-xs">
              Nhập lại mật khẩu
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => update("password_confirmation", e.target.value)}
              className="rounded-xl"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Đăng ký
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="block w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground mt-3 py-2.5 rounded-full bg-muted/50 hover:bg-muted/70 border border-border/40 transition-colors"
        >
          Để sau, tiếp tục xem ứng dụng
        </button>
      </Card>
    </main>
  );
}
