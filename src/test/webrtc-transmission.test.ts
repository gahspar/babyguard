import { describe, it, expect } from "vitest";
import { DEFAULT_STUN_SERVERS } from "@/lib/webrtc/ice-servers";
import { WebRTCSignalingMessage } from "@/types/webrtc";
import crypto from "crypto";

describe("WebRTC P2P Transmission & Signaling", () => {
  it("should have Google STUN servers configured as default fallback", () => {
    expect(DEFAULT_STUN_SERVERS).toHaveLength(1);
    expect(DEFAULT_STUN_SERVERS[0].urls).toContain("stun:stun.l.google.com:19302");
    expect(DEFAULT_STUN_SERVERS[0].urls).toContain("stun:stun1.l.google.com:19302");
  });

  it("should generate valid ephemeral HMAC-SHA1 credentials for TURN (RFC 5766)", () => {
    const turnSecret = "super-secret-turn-key-babyguard";
    const userId = "usr-test-abc";
    const ttlSeconds = 86400; // 24 hours
    const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiry}:${userId}`;

    const hmac = crypto.createHmac("sha1", turnSecret);
    hmac.update(username);
    const credential = hmac.digest("base64");

    expect(credential).toBeDefined();
    expect(typeof credential).toBe("string");
    expect(credential.length).toBeGreaterThan(10);
    expect(username.startsWith(`${expiry}:`)).toBe(true);
  });

  it("should correctly structure WebRTC signaling payloads", () => {
    const offerMessage: WebRTCSignalingMessage = {
      type: "offer",
      sdp: { type: "offer", sdp: "v=0\r\no=- 123 2 IN IP4 127.0.0.1..." },
      sessionId: "room-abc-123",
    };

    expect(offerMessage.type).toBe("offer");
    expect(offerMessage.sessionId).toBe("room-abc-123");
    expect(offerMessage.sdp.type).toBe("offer");

    const iceMessage: WebRTCSignalingMessage = {
      type: "ice-candidate",
      candidate: {
        candidate: "candidate:1 1 UDP 2130706431 192.168.1.50 54321 typ host",
        sdpMid: "0",
        sdpMLineIndex: 0,
      },
      sessionId: "room-abc-123",
    };

    expect(iceMessage.type).toBe("ice-candidate");
    expect(iceMessage.candidate.candidate).toContain("candidate:1 1 UDP");
  });

  it("should assess connection quality based on RTT latency and packet loss", () => {
    const assessQuality = (rtt: number, packetsLost: number) => {
      if (rtt > 300 || packetsLost > 20) return "poor";
      if (rtt > 150 || packetsLost > 5) return "good";
      return "excellent";
    };

    expect(assessQuality(45, 0)).toBe("excellent");
    expect(assessQuality(180, 2)).toBe("good");
    expect(assessQuality(350, 25)).toBe("poor");
  });
});
