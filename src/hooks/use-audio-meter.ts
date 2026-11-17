"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface AudioMeterState {
  volume: number; // 0 to 100%
  decibels: number; // dB approx (-100 to 0)
  isClipping: boolean;
  isActive: boolean;
}

export function useAudioMeter(audioTrack: MediaStreamTrack | null): AudioMeterState {
  const [state, setState] = useState<AudioMeterState>({
    volume: 0,
    decibels: -100,
    isClipping: false,
    isActive: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setState({
      volume: 0,
      decibels: -100,
      isClipping: false,
      isActive: false,
    });
  }, []);

  useEffect(() => {
    if (!audioTrack || audioTrack.readyState !== "live") {
      cleanup();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const stream = new MediaStream([audioTrack]);
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i];
          sum += val * val;
          if (val > peak) peak = val;
        }

        const rms = Math.sqrt(sum / bufferLength);
        const volumePercent = Math.min(100, Math.round((rms / 128) * 100));
        const db = rms > 0 ? 20 * Math.log10(rms / 255) : -100;
        const isClipping = peak >= 254;

        setState({
          volume: volumePercent,
          decibels: Math.round(db),
          isClipping,
          isActive: true,
        });

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error("Falha ao inicializar medidor de áudio WebAudio:", err);
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [audioTrack, cleanup]);

  return state;
}
