import {
  WebRTCConnectionStats,
  WebRTCSignalingMessage,
  ConnectionQuality,
} from "@/types/webrtc";
import { SupabaseRealtimeSignaling } from "./signaling-channel";
import { fetchIceServers } from "./ice-servers";

export type PeerRole = "station" | "monitor";

export interface PeerConnectionCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onStatsUpdate?: (stats: WebRTCConnectionStats) => void;
  onError?: (error: Error) => void;
}

export class WebRTCPeerManager {
  private peer: RTCPeerConnection | null = null;
  private signaling: SupabaseRealtimeSignaling | null = null;
  private sessionId: string;
  private role: PeerRole;
  private callbacks: PeerConnectionCallbacks;
  private statsInterval: number | null = null;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private remoteStream: MediaStream = new MediaStream();
  private prevBytesReceived = 0;
  private prevTimestamp = 0;

  constructor(
    sessionId: string,
    role: PeerRole,
    callbacks: PeerConnectionCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.role = role;
    this.callbacks = callbacks;
  }

  public async initialize(localStream?: MediaStream | null): Promise<void> {
    const iceServers = await fetchIceServers();

    this.peer = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 2,
      bundlePolicy: "max-bundle",
    });

    // Handle incoming remote tracks (Monitor side)
    this.peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    // Attach local stream tracks (Station side)
    if (localStream && this.role === "station") {
      localStream.getTracks().forEach((track) => {
        if (this.peer && localStream) {
          this.peer.addTrack(track, localStream);
        }
      });
    }

    // Handle local ICE candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate && this.signaling) {
        this.signaling.send({
          type: "ice-candidate",
          candidate: event.candidate.toJSON(),
          sessionId: this.sessionId,
        });
      }
    };

    // Monitor connection state
    this.peer.onconnectionstatechange = () => {
      if (!this.peer) return;
      const state = this.peer.connectionState;
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(state);
      }
      if (state === "connected") {
        this.startStatsCollection();
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        this.stopStatsCollection();
      }
    };

    // Connect signaling channel
    this.signaling = new SupabaseRealtimeSignaling(this.sessionId);
    this.signaling.connect((msg) => this.handleSignalingMessage(msg));

    // If role is station, create and dispatch the initial Offer
    if (this.role === "station") {
      await this.createAndSendOffer();
    }
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.peer || !this.signaling) return;
    try {
      const offer = await this.peer.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await this.peer.setLocalDescription(offer);
      await this.signaling.send({
        type: "offer",
        sdp: offer,
        sessionId: this.sessionId,
      });
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  private async handleSignalingMessage(msg: WebRTCSignalingMessage): Promise<void> {
    if (!this.peer) return;

    try {
      if (msg.type === "offer" && this.role === "monitor") {
        await this.peer.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        // Flush buffered ICE candidates
        while (this.iceCandidateQueue.length > 0) {
          const cand = this.iceCandidateQueue.shift();
          if (cand) await this.peer.addIceCandidate(new RTCIceCandidate(cand));
        }

        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);

        if (this.signaling) {
          await this.signaling.send({
            type: "answer",
            sdp: answer,
            sessionId: this.sessionId,
          });
        }
      } else if (msg.type === "answer" && this.role === "station") {
        await this.peer.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        while (this.iceCandidateQueue.length > 0) {
          const cand = this.iceCandidateQueue.shift();
          if (cand) await this.peer.addIceCandidate(new RTCIceCandidate(cand));
        }
      } else if (msg.type === "ice-candidate") {
        if (this.peer.remoteDescription) {
          await this.peer.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else {
          this.iceCandidateQueue.push(msg.candidate);
        }
      } else if (msg.type === "hangup") {
        this.close();
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  private startStatsCollection(): void {
    this.stopStatsCollection();
    this.statsInterval = window.setInterval(async () => {
      if (!this.peer || this.peer.connectionState !== "connected") return;

      try {
        const stats = await this.peer.getStats();
        let rtt = 0;
        let bitrateKbps = 0;
        let packetsLost = 0;
        let frameRate = 0;
        let width = 0;
        let height = 0;

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.currentRoundTripTime) {
            rtt = Math.round(report.currentRoundTripTime * 1000);
          }
          if (report.type === "inbound-rtp" && report.kind === "video") {
            packetsLost = report.packetsLost || 0;
            frameRate = Math.round(report.framesPerSecond || 0);

            const now = report.timestamp;
            const bytes = report.bytesReceived || 0;
            if (this.prevTimestamp > 0) {
              const deltaMs = now - this.prevTimestamp;
              const deltaBits = (bytes - this.prevBytesReceived) * 8;
              bitrateKbps = Math.round(deltaBits / deltaMs);
            }
            this.prevBytesReceived = bytes;
            this.prevTimestamp = now;
          }
          if (report.type === "track" && report.kind === "video") {
            width = report.frameWidth || 0;
            height = report.frameHeight || 0;
          }
        });

        let quality: ConnectionQuality = "excellent";
        if (rtt > 300 || packetsLost > 20) {
          quality = "poor";
        } else if (rtt > 150 || packetsLost > 5) {
          quality = "good";
        }

        if (this.callbacks.onStatsUpdate) {
          this.callbacks.onStatsUpdate({
            quality,
            latencyMs: rtt,
            bitrateKbps: Math.max(0, bitrateKbps),
            packetsLost,
            frameRate,
            resolution: { width, height },
          });
        }
      } catch {
        // stats error
      }
    }, 1000);
  }

  private stopStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private handleError(err: unknown): void {
    const error = err instanceof Error ? err : new Error("Erro desconhecido WebRTC.");
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  public close(): void {
    this.stopStatsCollection();
    if (this.signaling) {
      this.signaling.disconnect();
      this.signaling = null;
    }
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    this.remoteStream = new MediaStream();
  }
}
