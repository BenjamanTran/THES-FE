"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  fetchInvite,
  joinViaInvite,
  type InviteGameInfo,
  type Gender,
  type Tier,
} from "@/lib/api";
import { SKILL_LABELS, type SkillLevel } from "@/components/smashhub/skill-badge";

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

const TIER_ORDER: Tier[] = [
  "newbie",
  "beginner_plus",
  "lower_intermediate",
  "intermediate",
  "upper_intermediate",
  "advanced",
  "semi_pro",
  "professional",
];

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();

  const [gameInfo, setGameInfo] = useState<InviteGameInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [tier, setTier] = useState<Tier>("intermediate");
  const [stars, setStars] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvite(code)
      .then((res) => {
        if (!authLoading && user) {
          router.replace(`/?game=${res.game.id}`);
          return;
        }
        setGameInfo(res.game);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Không tìm thấy trận"))
      .finally(() => setLoading(false));
  }, [code, user, authLoading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await joinViaInvite(code, {
        name: name.trim(),
        gender,
        tier,
        stars,
      });
      await refresh();
      router.replace(`/?game=${res.game_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tham gia thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (loadError || !gameInfo) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-sm rounded-3xl border-border/50 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-2xl mx-auto mb-4">
            ❌
          </div>
          <h1 className="text-lg font-bold mb-2">Không tìm thấy trận</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {loadError || "Link mời không hợp lệ hoặc đã hết hạn."}
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => router.push("/")}>
            Về trang chủ
          </Button>
        </Card>
      </main>
    );
  }

  const isJoinable = gameInfo.status !== "finished" && gameInfo.status !== "cancelled" && gameInfo.players_count < gameInfo.max_players;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-sm rounded-3xl border-border/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <img src="/logo.webp" alt="SmashHub" className="w-12 h-12 rounded-2xl" />
          <div>
            <h1 className="text-xl font-bold">SmashHub</h1>
            <p className="text-xs text-muted-foreground">Bạn được mời tham gia trận</p>
          </div>
        </div>

        {/* Game info card */}
        <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4 mb-5 space-y-2">
          {gameInfo.description && (
            <p className="text-sm font-medium">{gameInfo.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {gameInfo.host_name && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Host: {gameInfo.host_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {gameInfo.players_count}/{gameInfo.max_players}
            </span>
            {gameInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {gameInfo.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(gameInfo.start_time)}
            </span>
          </div>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
            {gameInfo.match_type === "doubles" ? "Đánh đôi" : "Đánh đơn"}
          </span>
        </div>

        {!isJoinable ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Trận đã đầy hoặc không thể tham gia lúc này.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name" className="text-xs">
                Tên của bạn
              </Label>
              <Input
                id="guest-name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Minh"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Giới tính</Label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const active = gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={
                        "py-2 rounded-xl text-xs font-medium border transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Trình độ</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIER_ORDER.map((t) => {
                  const active = tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={
                        "py-2 rounded-xl text-xs font-medium border transition-colors text-left px-3 " +
                        (active
                          ? "bg-primary/15 text-primary border-primary/50"
                          : "bg-secondary/50 text-foreground border-border hover:bg-secondary")
                      }
                    >
                      {SKILL_LABELS[t as SkillLevel] || t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tự đánh giá (sao)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= stars
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Đánh giá trong phạm vi trình độ bạn chọn. 1 sao = mới lên, 5 sao = sắp lên tier trên.
              </p>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tham gia trận
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
