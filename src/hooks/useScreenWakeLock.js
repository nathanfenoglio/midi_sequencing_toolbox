import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake while `active` is true (Screen Wake Lock API).
 * No-op when unsupported or denied; releases on inactive or unmount.
 */
export function useScreenWakeLock(active) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!active) {
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
      return;
    }

    if (!navigator.wakeLock?.request) return;

    let cancelled = false;

    async function acquire() {
      try {
        if (cancelled || sentinelRef.current) return;
        sentinelRef.current = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.warn("Screen wake lock unavailable:", err);
      }
    }

    acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && active) {
        sentinelRef.current = null;
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]); // active is isSending from MainMidiContext
}
