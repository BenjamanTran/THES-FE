"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { fetchInvite, type InviteGameInfo } from "@/lib/api";
import { InviteGameLiveView } from "@/components/smashhub/invite-game-live-view";
import { useGameCable } from "@/hooks/use-game-cable";
import { disconnectGameCable, type GameCableEvent } from "@/lib/game-cable";
import {
  applyInviteCableEvent,
  normalizeInviteLiveState,
  type InviteLiveState,
} from "@/lib/invite-live-cable";

import { gameDetailPath } from "@/lib/game-paths";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [gameInfo, setGameInfo] = useState<InviteGameInfo | null>(null);
  const [inviteLive, setInviteLive] = useState<InviteLiveState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (loading || authLoading || !gameInfo) return;

    if (gameInfo.mode === "join") {
      const detailPath = gameDetailPath(gameInfo.id);
      if (user) {
        router.replace(detailPath);
      } else {
        router.replace(`/login?next=${encodeURIComponent(detailPath)}`);
      }
    }
  }, [loading, authLoading, gameInfo, user, router]);

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

  if (loading || authLoading || gameInfo?.mode === "join") {
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
