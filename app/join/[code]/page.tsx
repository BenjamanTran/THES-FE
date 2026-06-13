"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fetchInvite, joinGame, joinViaInvite, type Gender, type InviteGameInfo, type Tier } from "@/lib/api";
import { InviteGameLiveView } from "@/components/smashhub/invite-game-live-view";
import { useGameCable } from "@/hooks/use-game-cable";
import { disconnectGameCable, type GameCableEvent } from "@/lib/game-cable";
import {
  applyInviteCableEvent,
  normalizeInviteLiveState,
  type InviteLiveState,
} from "@/lib/invite-live-cable";

import { gameDetailPath } from "@/lib/game-paths";
import { SKILL_LABELS, type SkillLevel } from "@/components/smashhub/skill-badge";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

const TIER_OPTIONS: Tier[] = [
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
  const [inviteLive, setInviteLive] = useState<InviteLiveState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinName, setJoinName] = useState("");
  const [joinGender, setJoinGender] = useState<Gender>("male");
  const [joinTier, setJoinTier] = useState<Tier>("newbie");
  const [joinStars, setJoinStars] = useState(3);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  /** Realtime only while session is live; closed = HTTP fetch only */
  const useRealtime = gameInfo?.mode === "live";
  const isClosedMode = gameInfo?.mode === "closed";

  const applyInvitePayload = useCallback(
    (res: Awaited<ReturnType<typeof fetchInvite>>) => {
      setGameInfo(res.game);
      if (res.game.mode === "live" || res.game.mode === "closed") {
        setInviteLive(
          normalizeInviteLiveState(
            {
              players: res.players ?? [],
              matches: res.matches ?? [],
              matchCounts: res.match_counts ?? { pending: 0, ongoing: 0, finished: 0 },
            },
            res.game.mode === "live",
          ),
        );
      }
    },
    [],
  );

  const refreshInviteLive = useCallback(() => {
    fetchInvite(code)
      .then(applyInvitePayload)
      .catch(() => {});
  }, [code, applyInvitePayload]);

  useEffect(() => {
    let cancelled = false;

    fetchInvite(code)
      .then((res) => {
        if (cancelled) return;
        applyInvitePayload(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Không tìm thấy trận");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, applyInvitePayload]);

  useEffect(() => {
    if (isClosedMode) disconnectGameCable();
  }, [isClosedMode]);

  const handleInviteCableEvent = useCallback(
    (payload: GameCableEvent) => {
      setInviteLive((prev) =>
        prev
          ? applyInviteCableEvent(prev, payload, { liveSnapshot: true })
          : prev,
      );
    },
    [],
  );

  const inviteCableConnected = useGameCable(
    useRealtime ? (gameInfo?.id ?? null) : null,
    handleInviteCableEvent,
    useRealtime,
    { inviteCode: code },
  );

  useEffect(() => {
    if (loading || !useRealtime) return;
    const pollMs = inviteCableConnected ? 45_000 : 5_000;
    const id = window.setInterval(refreshInviteLive, pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshInviteLive();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [useRealtime, loading, refreshInviteLive, inviteCableConnected]);

  useEffect(() => {
    if (loading || !isClosedMode) return;
    refreshInviteLive();
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshInviteLive();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isClosedMode, loading, refreshInviteLive]);

  const handleLoggedInJoin = async () => {
    if (!gameInfo) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      await joinGame(gameInfo.id);
      router.replace(gameDetailPath(gameInfo.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tham gia trận";
      if (/already joined|đã tham gia/i.test(message)) {
        router.replace(gameDetailPath(gameInfo.id));
        return;
      }
      setJoinError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleGuestJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gameInfo) return;
    const name = joinName.trim();
    if (!name) {
      setJoinError("Vui lòng nhập tên");
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    try {
      const res = await joinViaInvite(code, {
        name,
        gender: joinGender,
        tier: joinTier,
        stars: joinStars,
      });
      await refresh();
      router.replace(gameDetailPath(res.game_id));
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Không thể tham gia trận");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading || authLoading) {
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

  const isSnapshotView =
    gameInfo.mode === "live" || gameInfo.mode === "closed";

  const pageSubtitle = (() => {
    if (gameInfo.mode === "closed") return "Kết quả trận đấu";
    if (gameInfo.mode === "live") return "Theo dõi trận đấu";
    return "Bạn được mời tham gia trận";
  })();

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-sm rounded-3xl border-border/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <img src="/logo.webp" alt="SmashHub" className="w-12 h-12 rounded-2xl" />
          <div>
            <h1 className="text-xl font-bold">SmashHub</h1>
            <p className="text-xs text-muted-foreground">{pageSubtitle}</p>
          </div>
        </div>

        {isSnapshotView && inviteLive ? (
          <InviteGameLiveView
            game={gameInfo}
            players={inviteLive.players}
            matches={inviteLive.matches}
            matchCounts={inviteLive.matchCounts}
            onGoHome={() => router.push("/")}
          />
        ) : gameInfo.mode === "join" ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/40 border border-border/30 p-4 space-y-2">
              {gameInfo.description && (
                <p className="text-sm font-medium">{gameInfo.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {gameInfo.host_name && <span>Host: {gameInfo.host_name}</span>}
                <span>
                  {gameInfo.players_count}/{gameInfo.max_players} người
                </span>
                {gameInfo.location && <span>{gameInfo.location}</span>}
              </div>
            </div>

            {joinError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                {joinError}
              </p>
            )}

            {user ? (
              <Button
                className="w-full rounded-full"
                onClick={() => void handleLoggedInJoin()}
                disabled={joinLoading}
              >
                {joinLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Tham gia trận
              </Button>
            ) : (
              <form onSubmit={handleGuestJoin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-name" className="text-xs">
                    Tên hiển thị
                  </Label>
                  <Input
                    id="guest-name"
                    required
                    maxLength={80}
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Giới tính</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setJoinGender(opt.value)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-medium border transition-colors",
                          joinGender === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border hover:bg-secondary",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Trình độ</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIER_OPTIONS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setJoinTier(tier)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-medium border transition-colors",
                          joinTier === tier
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border hover:bg-secondary",
                        )}
                      >
                        {SKILL_LABELS[tier as SkillLevel] || tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Số sao</Label>
                  <div className="flex justify-center gap-1.5 rounded-xl border border-border bg-secondary/30 py-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setJoinStars(star)}
                        className="p-1"
                        aria-label={`${star} sao`}
                      >
                        <Star
                          className={cn(
                            "w-6 h-6",
                            star <= joinStars
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full rounded-full" type="submit" disabled={joinLoading}>
                  {joinLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Tham gia trận
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Trận đã đầy hoặc không thể xem lúc này.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
