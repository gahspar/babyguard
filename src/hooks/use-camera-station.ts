"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CaptureStatus,
  MediaDeviceOption,
  ResolutionPreset,
} from "@/lib/media/types";
import { StandardBrowserMediaCapture } from "@/lib/media/browser-capture-provider";
import { IpCameraStreamCaptureProvider } from "@/lib/media/ip-camera-provider";

export type CaptureSourceType = "webcam" | "ip_camera";

export interface ActualTrackInfo {
  label: string;
  width?: number;
  height?: number;
  frameRate?: number;
  isLogitech: boolean;
}

export function useCameraStation() {
  const [sourceType, setSourceType] = useState<CaptureSourceType>("webcam");
  const [ipCameraUrl, setIpCameraUrl] = useState<string>("http://192.168.1.100:8080/video");
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

  const browserProviderRef = useRef<StandardBrowserMediaCapture | null>(null);
  const ipProviderRef = useRef<IpCameraStreamCaptureProvider | null>(null);

  if (!browserProviderRef.current) {
    browserProviderRef.current = new StandardBrowserMediaCapture();
  }
  if (!ipProviderRef.current) {
    ipProviderRef.current = new IpCameraStreamCaptureProvider(ipCameraUrl);
  }

  const updateTrackInfo = (activeStream: MediaStream | null) => {
    if (!activeStream) {
      setTrackInfo(null);
      return;
    }
    const videoTrack = activeStream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      const label =
        sourceType === "ip_camera"
          ? `USB Camera (Android IP: ${ipCameraUrl})`
          : videoTrack.label || "Webcam";
      const isLogitech = /logi|logitech|c920|c270|c922|brio|usb/i.test(label);
      setTrackInfo({
        label,
        width: settings.width || 1280,
        height: settings.height || 720,
        frameRate: settings.frameRate ? Math.round(settings.frameRate) : 30,
        isLogitech,
      });
    }
  };

  const refreshDevices = useCallback(async () => {
    if (!browserProviderRef.current) return;
    const { videoDevices: vDevs, audioDevices: aDevs } =
      await browserProviderRef.current.getAvailableDevices();
    setVideoDevices(vDevs);
    setAudioDevices(aDevs);

    if (vDevs.length > 0 && !selectedVideoDeviceId) {
      setSelectedVideoDeviceId(vDevs[0].deviceId);
    }
    if (aDevs.length > 0 && !selectedAudioDeviceId) {
      setSelectedAudioDeviceId(aDevs[0].deviceId);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  const startCapture = async () => {
    setErrorMessage(null);
    setStatus("requesting_permission");

    try {
      let newStream: MediaStream;

      if (sourceType === "ip_camera") {
        if (!ipProviderRef.current) return;
        ipProviderRef.current.setStreamUrl(ipCameraUrl);
        newStream = await ipProviderRef.current.start();
      } else {
        if (!browserProviderRef.current) return;
        newStream = await browserProviderRef.current.start({
          videoDeviceId: selectedVideoDeviceId || undefined,
          audioDeviceId: selectedAudioDeviceId || undefined,
          resolution,
        });
        await refreshDevices();
      }

      setStream(newStream);
      setStatus("active");
      updateTrackInfo(newStream);
      setIsAudioMuted(false);
      setIsVideoPaused(false);
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Erro ao inicializar câmera.";
      setErrorMessage(msg);
      setStream(null);
      setTrackInfo(null);
    }
  };

  const stopCapture = () => {
    if (browserProviderRef.current) {
      browserProviderRef.current.stop();
    }
    if (ipProviderRef.current) {
      ipProviderRef.current.stop();
    }
    setStream(null);
    setStatus("idle");
    setTrackInfo(null);
  };

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    if (status === "active" && sourceType === "webcam" && browserProviderRef.current) {
      try {
        const newStream = await browserProviderRef.current.switchVideoDevice(deviceId);
        setStream(newStream);
        updateTrackInfo(newStream);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao trocar de câmera.");
      }
    }
  };

  const changeAudioDevice = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    if (status === "active" && sourceType === "webcam" && browserProviderRef.current) {
      try {
        const newStream = await browserProviderRef.current.switchAudioDevice(deviceId);
        setStream(newStream);
        updateTrackInfo(newStream);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao trocar microfone.");
      }
    }
  };

  const changeResolution = async (newRes: ResolutionPreset) => {
    setResolution(newRes);
    if (status === "active" && sourceType === "webcam" && browserProviderRef.current) {
      try {
        const newStream = await browserProviderRef.current.changeResolution(newRes);
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

  useEffect(() => {
    refreshDevices();

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

  useEffect(() => {
    return () => {
      if (browserProviderRef.current) browserProviderRef.current.stop();
      if (ipProviderRef.current) ipProviderRef.current.stop();
    };
  }, []);

  return {
    sourceType,
    setSourceType,
    ipCameraUrl,
    setIpCameraUrl,
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
