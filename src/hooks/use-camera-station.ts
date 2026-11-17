"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CaptureStatus,
  MediaDeviceOption,
  ResolutionPreset,
  RESOLUTION_PRESETS,
} from "@/lib/media/types";
import { StandardBrowserMediaCapture } from "@/lib/media/browser-capture-provider";

export interface ActualTrackInfo {
  label: string;
  width?: number;
  height?: number;
  frameRate?: number;
  isLogitech: boolean;
}

export function useCameraStation() {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [resolution, setResolution] = useState<ResolutionPreset>("720p");
  const [trackInfo, setTrackInfo] = useState<ActualTrackInfo | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  const captureProviderRef = useRef<StandardBrowserMediaCapture | null>(null);

  if (!captureProviderRef.current) {
    captureProviderRef.current = new StandardBrowserMediaCapture();
  }

  const updateTrackInfo = (activeStream: MediaStream | null) => {
    if (!activeStream) {
      setTrackInfo(null);
      return;
    }
    const videoTrack = activeStream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      const label = videoTrack.label || "Webcam";
      const isLogitech = /logi|logitech|c920|c270|c922|brio/i.test(label);
      setTrackInfo({
        label,
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate ? Math.round(settings.frameRate) : undefined,
        isLogitech,
      });
    }
  };

  const refreshDevices = useCallback(async () => {
    if (!captureProviderRef.current) return;
    const { videoDevices: vDevs, audioDevices: aDevs } =
      await captureProviderRef.current.getAvailableDevices();
    setVideoDevices(vDevs);
    setAudioDevices(aDevs);

    // If no device currently selected, default to first (which is Logitech if available)
    if (vDevs.length > 0 && !selectedVideoDeviceId) {
      setSelectedVideoDeviceId(vDevs[0].deviceId);
    }
    if (aDevs.length > 0 && !selectedAudioDeviceId) {
      setSelectedAudioDeviceId(aDevs[0].deviceId);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  const startCapture = async () => {
    if (!captureProviderRef.current) return;
    setErrorMessage(null);
    setStatus("requesting_permission");

    try {
      const newStream = await captureProviderRef.current.start({
        videoDeviceId: selectedVideoDeviceId || undefined,
        audioDeviceId: selectedAudioDeviceId || undefined,
        resolution,
      });

      setStream(newStream);
      setStatus("active");
      updateTrackInfo(newStream);
      setIsAudioMuted(false);
      setIsVideoPaused(false);

      // Once permission is granted, labels become populated, refresh device list
      await refreshDevices();
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Erro ao inicializar câmera.";
      setErrorMessage(msg);
      setStream(null);
      setTrackInfo(null);
    }
  };

  const stopCapture = () => {
    if (captureProviderRef.current) {
      captureProviderRef.current.stop();
    }
    setStream(null);
    setStatus("idle");
    setTrackInfo(null);
  };

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    if (status === "active" && captureProviderRef.current) {
      try {
        const newStream = await captureProviderRef.current.switchVideoDevice(deviceId);
        setStream(newStream);
        updateTrackInfo(newStream);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao trocar de câmera.");
      }
    }
  };

  const changeAudioDevice = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    if (status === "active" && captureProviderRef.current) {
      try {
        const newStream = await captureProviderRef.current.switchAudioDevice(deviceId);
        setStream(newStream);
        updateTrackInfo(newStream);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao trocar microfone.");
      }
    }
  };

  const changeResolution = async (newRes: ResolutionPreset) => {
    setResolution(newRes);
    if (status === "active" && captureProviderRef.current) {
      try {
        const newStream = await captureProviderRef.current.changeResolution(newRes);
        setStream(newStream);
        updateTrackInfo(newStream);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao alterar resolução.");
      }
    }
  };

  const toggleAudioMute = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideoPause = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoPaused(!videoTrack.enabled);
    }
  };

  // Initial load: enumerate devices
  useEffect(() => {
    refreshDevices();

    // Listen for device change events (e.g. plugging in Logitech USB webcam)
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      const handleDeviceChange = () => {
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      };
    }
  }, [refreshDevices]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (captureProviderRef.current) {
        captureProviderRef.current.stop();
      }
    };
  }, []);

  return {
    status,
    errorMessage,
    stream,
    videoTrack: stream?.getVideoTracks()[0] || null,
    audioTrack: stream?.getAudioTracks()[0] || null,
    trackInfo,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    resolution,
    isAudioMuted,
    isVideoPaused,
    startCapture,
    stopCapture,
    changeVideoDevice,
    changeAudioDevice,
    changeResolution,
    toggleAudioMute,
    toggleVideoPause,
    refreshDevices,
  };
}
