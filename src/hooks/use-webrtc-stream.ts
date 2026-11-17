"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  WebRTCConnectionStats,
  ConnectionQuality,
} from "@/types/webrtc";
import { WebRTCPeerManager, PeerRole } from "@/lib/webrtc/peer-connection";

export interface UseWebRTCStreamOptions {
  sessionId: string;
  role: PeerRole;
  localStream?: MediaStream | null;
  autoConnect?: boolean;
}

export function useWebRTCStream({
  sessionId,
  role,
  localStream,
  autoConnect = true,
}: UseWebRTCStreamOptions) {
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [stats, setStats] = useState<WebRTCConnectionStats>({
    quality: "disconnected",
    latencyMs: 0,
    bitrateKbps: 0,
    packetsLost: 0,
    frameRate: 0,
    resolution: { width: 0, height: 0 },
  });
  const [error, setError] = useState<string | null>(null);

  const peerManagerRef = useRef<WebRTCPeerManager | null>(null);

  const connect = useCallback(async () => {
    if (!sessionId) return;
    setError(null);

    // Clean up any existing connection
    if (peerManagerRef.current) {
      peerManagerRef.current.close();
    }

    const manager = new WebRTCPeerManager(sessionId, role, {
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onStatsUpdate: (updatedStats) => {
        setStats(updatedStats);
      },
      onError: (err) => {
        setError(err.message);
      },
    });

    peerManagerRef.current = manager;

    try {
      await manager.initialize(localStream);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao estabelecer conexão P2P.";
      setError(msg);
    }
  }, [sessionId, role, localStream]);

  const disconnect = useCallback(() => {
    if (peerManagerRef.current) {
      peerManagerRef.current.close();
      peerManagerRef.current = null;
    }
    setConnectionState("closed");
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    if (autoConnect && sessionId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, sessionId, connect, disconnect]);

  return {
    connectionState,
    remoteStream,
    stats,
    error,
    connect,
    disconnect,
    isConnected: connectionState === "connected",
  };
}
