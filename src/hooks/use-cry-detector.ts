"use client";

import { useEffect, useState, useRef } from "react";
import {
  CryDetectionResult,
  CryDetectorConfig,
} from "@/lib/ai/cry-detector-interface";
import { SpectralInfantCryDetector } from "@/lib/ai/spectral-cry-detector";
import { createClient } from "@/lib/supabase/client";

export function useCryDetector(
  audioTrack: MediaStreamTrack | null,
  sessionId = "default-room",
  initialConfig?: Partial<CryDetectorConfig>
) {
  const [result, setResult] = useState<CryDetectionResult>({
    state: "silence",
    probability: 0,
    harmonicEnergyRatio: 0,
    continuousDurationMs: 0,
    timestamp: Date.now(),
  });

  const [history, setHistory] = useState<
    { state: string; timestamp: string; durationMs: number }[]
  >([]);

  const detectorRef = useRef<SpectralInfantCryDetector | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!audioTrack || audioTrack.readyState !== "live") {
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      return;
    }

    const detector = new SpectralInfantCryDetector();
    if (initialConfig) {
      detector.updateConfig(initialConfig);
    }
    detectorRef.current = detector;

    const channel = supabase.channel(`monitor_room:${sessionId}`);
    channel.subscribe();

    detector.onDetection((newResult) => {
      setResult(newResult);

      // When reaching active alert or transition from silence, broadcast via Realtime
      if (newResult.state === "active_alert" || newResult.state === "cry_detected") {
        channel.send({
          type: "broadcast",
          event: "cry_alert",
          payload: {
            state: newResult.state,
            probability: newResult.probability,
            timestamp: new Date().toISOString(),
          },
        });

        // Add to local event audit history (in-memory only, no media stored)
        setHistory((prev) => {
          const last = prev[0];
          if (!last || last.state !== newResult.state) {
            return [
              {
                state: newResult.state,
                timestamp: new Date().toLocaleTimeString("pt-BR"),
                durationMs: newResult.continuousDurationMs,
              },
              ...prev.slice(0, 19), // keep last 20 events
            ];
          }
          return prev;
        });
      }
    });

    detector.initialize(audioTrack).catch((err) => {
      console.warn("Falha ao inicializar detector de choro:", err);
    });

    return () => {
      detector.dispose();
      channel.unsubscribe();
    };
  }, [audioTrack, sessionId, initialConfig, supabase]);

  return {
    result,
    history,
  };
}
