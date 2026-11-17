"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useWakeLock(enabled = true) {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsLocked(true);

      wakeLockRef.current.addEventListener("release", () => {
        setIsLocked(false);
        wakeLockRef.current = null;
      });
    } catch (err) {
      console.warn("Screen Wake Lock não pôde ser ativado:", err);
      setIsLocked(false);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // When user minimizes or returns to tab in Safari/Chrome, reacquire lock
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  return { isLocked };
}
