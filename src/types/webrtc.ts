export type ConnectionQuality = "excellent" | "good" | "poor" | "disconnected";

export interface WebRTCConnectionStats {
  quality: ConnectionQuality;
  latencyMs: number;
  bitrateKbps: number;
  packetsLost: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
}

export type WebRTCSignalingMessage =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; sessionId: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; sessionId: string }
  | { type: "join"; sessionId: string }
  | { type: "hangup"; sessionId: string };

export type CryDetectionState =
  | "silence"
  | "possible_cry"
  | "cry_detected"
  | "active_alert";
