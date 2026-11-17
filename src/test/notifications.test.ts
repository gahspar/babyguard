import { describe, it, expect, vi } from "vitest";
import {
  NotificationManager,
  BabyGuardNotificationPayload,
} from "@/lib/notifications/notification-manager";

describe("Notifications System (Push, Audio & Visual)", () => {
  it("should format notification payloads for critical events", () => {
    const cryNotification: BabyGuardNotificationPayload = {
      type: "cry_detected",
      title: "Alerta do Berço: Choro Detectado",
      body: "O BabyGuard identificou choro contínuo no quarto do bebê.",
      playAudio: true,
    };

    expect(cryNotification.type).toBe("cry_detected");
    expect(cryNotification.playAudio).toBe(true);

    const disconnectNotification: BabyGuardNotificationPayload = {
      type: "camera_disconnected",
      title: "Câmera Desconectada",
      body: "A webcam Logitech USB foi desconectada do computador.",
    };

    expect(disconnectNotification.type).toBe("camera_disconnected");
  });

  it("should request Notification permission when API is present", async () => {
    const manager = new NotificationManager();

    // In JSDOM without permission, returns false gracefully without crashing
    const granted = await manager.requestPermission();
    expect(typeof granted).toBe("boolean");
  });
});
