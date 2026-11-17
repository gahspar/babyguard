import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StandardBrowserMediaCapture,
  AndroidUsbOtgMediaCaptureProvider,
} from "@/lib/media/browser-capture-provider";
import { RESOLUTION_PRESETS } from "@/lib/media/types";

describe("Media Capture Provider & Abstraction Layer", () => {
  let provider: StandardBrowserMediaCapture;

  beforeEach(() => {
    provider = new StandardBrowserMediaCapture();
  });

  it("should have correct resolution presets configuration", () => {
    expect(RESOLUTION_PRESETS["720p"].width).toBe(1280);
    expect(RESOLUTION_PRESETS["720p"].height).toBe(720);
    expect(RESOLUTION_PRESETS["720p"].idealFps).toBe(30);

    expect(RESOLUTION_PRESETS["480p"].width).toBe(854);
    expect(RESOLUTION_PRESETS["480p"].height).toBe(480);

    expect(RESOLUTION_PRESETS["360p"].width).toBe(640);
    expect(RESOLUTION_PRESETS["360p"].height).toBe(360);
  });

  it("should identify Logitech webcams and microphones with regex", () => {
    const testLabels = [
      { label: "Logitech HD Pro Webcam C920", isLogitech: true },
      { label: "HD Webcam C270 (Logitech)", isLogitech: true },
      { label: "Logitech Brio 4K Stream Edition", isLogitech: true },
      { label: "Integrated Camera (04f2:b6d9)", isLogitech: false },
      { label: "Realtek High Definition Audio", isLogitech: false },
    ];

    const regex = /logi|logitech|c920|c270|c922|brio|quickcam/i;

    for (const test of testLabels) {
      expect(regex.test(test.label)).toBe(test.isLogitech);
    }
  });

  it("should correctly handle device enumeration sorting to prioritize Logitech", async () => {
    // Mock navigator.mediaDevices
    const mockDevices: MediaDeviceInfo[] = [
      {
        deviceId: "id-generic",
        kind: "videoinput",
        label: "Integrated Camera",
        groupId: "group1",
        toJSON: () => ({}),
      },
      {
        deviceId: "id-logi",
        kind: "videoinput",
        label: "Logitech Webcam C920 HD 720p",
        groupId: "group2",
        toJSON: () => ({}),
      },
    ];

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      },
      configurable: true,
      writable: true,
    });

    const { videoDevices } = await provider.getAvailableDevices();

    expect(videoDevices).toHaveLength(2);
    // Logitech device must be sorted first
    expect(videoDevices[0].isLogitech).toBe(true);
    expect(videoDevices[0].deviceId).toBe("id-logi");
    expect(videoDevices[1].isLogitech).toBe(false);
  });

  it("should format NotAllowedError with friendly Portuguese instructions", async () => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException("Permission denied", "NotAllowedError")),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
      writable: true,
    });

    await expect(provider.start()).rejects.toThrow(
      "Permissão de acesso à câmera e microfone negada. Autorize o acesso no seu navegador."
    );
    expect(provider.getStatus()).toBe("error");
  });

  it("should detect Android environment via User Agent in abstraction", () => {
    const originalUA = navigator.userAgent;

    Object.defineProperty(global.navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      configurable: true,
      writable: true,
    });

    expect(AndroidUsbOtgMediaCaptureProvider.isAndroidDevice()).toBe(true);

    Object.defineProperty(global.navigator, "userAgent", {
      value: originalUA,
      configurable: true,
      writable: true,
    });
  });
});
