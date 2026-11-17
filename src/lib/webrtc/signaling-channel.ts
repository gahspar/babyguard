import { createClient } from "@/lib/supabase/client";
import { WebRTCSignalingMessage } from "@/types/webrtc";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SignalingCallback = (msg: WebRTCSignalingMessage) => void;

export class SupabaseRealtimeSignaling {
  private channel: RealtimeChannel | null = null;
  private channelId: string;
  private onMessageCallback: SignalingCallback | null = null;

  constructor(sessionId: string) {
    this.channelId = `webrtc_session:${sessionId}`;
  }

  public connect(onMessage: SignalingCallback): void {
    this.onMessageCallback = onMessage;
    const supabase = createClient();

    this.channel = supabase.channel(this.channelId, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    this.channel
      .on("broadcast", { event: "signal" }, (payload) => {
        if (payload?.payload && this.onMessageCallback) {
          this.onMessageCallback(payload.payload as WebRTCSignalingMessage);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Signaling] Conectado ao canal ${this.channelId}`);
        }
      });
  }

  public async send(message: WebRTCSignalingMessage): Promise<void> {
    if (!this.channel) {
      console.warn("[Signaling] Canal não conectado para envio de mensagem.");
      return;
    }
    await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: message,
    });
  }

  public disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.onMessageCallback = null;
  }
}
