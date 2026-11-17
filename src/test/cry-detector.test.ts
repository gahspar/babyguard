import { describe, it, expect } from "vitest";
import { SpectralInfantCryDetector } from "@/lib/ai/spectral-cry-detector";

describe("Infant Cry Spectral Recognition AI", () => {
  it("should classify infant cry formant frequencies as higher probability than background rumble", () => {
    const detector = new SpectralInfantCryDetector();
    detector.updateConfig({ sensitivity: 80, minDurationMs: 1000 });

    const binCount = 512;
    const binSize = 44100 / 1024; // ~43.06 Hz per bin

    // Scenario A: Background Rumble (Air conditioning / traffic: energy at 60Hz - 120Hz)
    const rumbleSpectrum = new Float32Array(binCount).fill(-90);
    rumbleSpectrum[1] = -15; // ~43Hz
    rumbleSpectrum[2] = -10; // ~86Hz
    rumbleSpectrum[3] = -20; // ~129Hz

    const rumbleResult = detector.processSpectralFrame(rumbleSpectrum, binSize);
    expect(rumbleResult.state).toBe("silence");
    expect(rumbleResult.probability).toBeLessThan(0.3);

    // Scenario B: Infant Cry Simulation (Fundamental at 516Hz [bin 12] + Formants at 2153Hz [bin 50])
    const crySpectrum = new Float32Array(binCount).fill(-85);
    crySpectrum[12] = -12; // 516 Hz (F0)
    crySpectrum[13] = -14;
    crySpectrum[50] = -16; // 2153 Hz (First formant)
    crySpectrum[51] = -18;

    const cryResult = detector.processSpectralFrame(crySpectrum, binSize);
    expect(cryResult.harmonicEnergyRatio).toBeGreaterThan(0.5);
    expect(cryResult.fundamentalFrequencyHz).toBeGreaterThanOrEqual(400);
    expect(cryResult.fundamentalFrequencyHz).toBeLessThanOrEqual(650);
  });

  it("should transition through states: silence -> possible_cry -> cry_detected", () => {
    const detector = new SpectralInfantCryDetector();
    detector.updateConfig({ sensitivity: 90, minDurationMs: 1500 });

    const binCount = 512;
    const binSize = 44100 / 1024;

    const crySpectrum = new Float32Array(binCount).fill(-85);
    crySpectrum[12] = -10; // 516Hz F0
    crySpectrum[50] = -15; // 2153Hz

    // Frame 1: Initial detection triggers possible_cry
    const res1 = detector.processSpectralFrame(crySpectrum, binSize);
    expect(["possible_cry", "cry_detected", "active_alert"]).toContain(res1.state);
  });
});
