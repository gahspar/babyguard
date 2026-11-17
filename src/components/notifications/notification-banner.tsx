"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Bell, WifiOff, VideoOff, MicOff, X } from "lucide-react";
import { BabyGuardNotificationPayload } from "@/lib/notifications/notification-manager";

interface NotificationBannerProps {
  notification: BabyGuardNotificationPayload | null;
  onDismiss: () => void;
}

export function NotificationBanner({
  notification,
  onDismiss,
}: NotificationBannerProps) {
  if (!notification) return null;

  const isCry = notification.type === "cry_detected";

  const getIcon = () => {
    switch (notification.type) {
      case "cry_detected":
        return <Bell className="h-5 w-5 text-rose-400 animate-bounce" />;
      case "camera_disconnected":
        return <VideoOff className="h-5 w-5 text-amber-400" />;
      case "microphone_disconnected":
        return <MicOff className="h-5 w-5 text-amber-400" />;
      case "connection_lost":
      case "station_offline":
      case "stream_interrupted":
      default:
        return <WifiOff className="h-5 w-5 text-red-400" />;
    }
  };

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 max-w-xl mx-auto rounded-2xl p-4 shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
        isCry
          ? "bg-rose-950/90 border-rose-600 text-rose-100 shadow-rose-950/80 ring-2 ring-rose-500/50"
          : "bg-night-900/95 border-amber-600/80 text-amber-100 shadow-amber-950/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{notification.title}</h4>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
              {notification.body}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
          title="Fechar Notificação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
