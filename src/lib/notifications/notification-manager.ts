import { audioAlarm } from "./audio-alarm";

export type BabyGuardNotificationType =
  | "cry_detected"
  | "camera_disconnected"
  | "microphone_disconnected"
  | "connection_lost"
  | "stream_interrupted"
  | "station_offline";

export interface BabyGuardNotificationPayload {
  type: BabyGuardNotificationType;
  title: string;
  body: string;
  playAudio?: boolean;
}

export class NotificationManager {
  private hasPermission = false;

  constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.hasPermission = Notification.permission === "granted";
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === "granted";
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  public notify(payload: BabyGuardNotificationPayload): void {
    // 1. Play synthesized audio alarm
    if (payload.playAudio !== false) {
      if (payload.type === "cry_detected") {
        audioAlarm.playCryAlarm();
      } else {
        audioAlarm.playDisconnectChime();
      }
    }

    // 2. Trigger native OS / Web Push notification if supported and granted
    if (typeof window !== "undefined" && "Notification" in window && this.hasPermission) {
      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: "/icons/icon-192.png",
          tag: payload.type,
        });
      } catch {
        // Fallback or iOS background limitation
      }
    }
  }
}

export const notificationManager = new NotificationManager();
