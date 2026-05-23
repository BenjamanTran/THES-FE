/**
 * Bridge for SmashHub native app (Expo WebView shell in `app/`).
 * No-op in browser; active when `window.SmashHubNative` is injected.
 */

export type NativeBridgeMessage =
  | { type: "PUSH_TOKEN"; token: string | null; error?: string }
  | { type: "NOTIFICATION_OPENED"; url: string }
  | { type: "NATIVE_READY"; platform: string; appVersion: string }
  | { type: "PONG" };

declare global {
  interface Window {
    SmashHubNative?: {
      platform: string;
      appVersion: string;
      postMessage: (payload: { type: string }) => void;
    };
  }
}

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.SmashHubNative);
}

export function requestPushToken(): void {
  window.SmashHubNative?.postMessage({ type: "REQUEST_PUSH_TOKEN" });
}

export function onNativeMessage(
  handler: (message: NativeBridgeMessage) => void,
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<NativeBridgeMessage>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener("smashhub-native", listener);
  return () => window.removeEventListener("smashhub-native", listener);
}
