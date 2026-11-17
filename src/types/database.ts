export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DeviceType = "station" | "monitor";
export type SessionStatus = "pending" | "active" | "ended";
export type ConnectionEventType =
  | "device_registered"
  | "pairing_generated"
  | "pairing_used"
  | "device_revoked"
  | "session_started"
  | "session_ended"
  | "webrtc_connected"
  | "webrtc_disconnected"
  | "webrtc_failed"
  | "cry_alert";

export interface GenericRelationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: DeviceType;
          device_fingerprint: string;
          is_active: boolean;
          revoked_at: string | null;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: DeviceType;
          device_fingerprint: string;
          is_active?: boolean;
          revoked_at?: string | null;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: DeviceType;
          device_fingerprint?: string;
          is_active?: boolean;
          revoked_at?: string | null;
          created_at?: string;
          last_seen_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      pairing_codes: {
        Row: {
          id: string;
          user_id: string;
          code_hash: string;
          target_device_type: DeviceType;
          device_name: string;
          expires_at: string;
          used_at: string | null;
          is_revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_hash: string;
          target_device_type: DeviceType;
          device_name: string;
          expires_at: string;
          used_at?: string | null;
          is_revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_hash?: string;
          target_device_type?: DeviceType;
          device_name?: string;
          expires_at?: string;
          used_at?: string | null;
          is_revoked?: boolean;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      monitoring_sessions: {
        Row: {
          id: string;
          user_id: string;
          station_device_id: string;
          monitor_device_id: string | null;
          status: SessionStatus;
          signaling_channel_id: string;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          station_device_id: string;
          monitor_device_id?: string | null;
          status?: SessionStatus;
          signaling_channel_id: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          station_device_id?: string;
          monitor_device_id?: string | null;
          status?: SessionStatus;
          signaling_channel_id?: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      connection_events: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          device_id: string | null;
          event_type: ConnectionEventType;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          device_id?: string | null;
          event_type: ConnectionEventType;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          device_id?: string | null;
          event_type?: ConnectionEventType;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      user_preferences: {
        Row: {
          user_id: string;
          cry_sensitivity: number;
          cry_min_duration_ms: number;
          video_max_resolution: string;
          video_max_framerate: number;
          audio_noise_suppression: boolean;
          audio_echo_cancellation: boolean;
          alert_sound_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cry_sensitivity?: number;
          cry_min_duration_ms?: number;
          video_max_resolution?: string;
          video_max_framerate?: number;
          audio_noise_suppression?: boolean;
          audio_echo_cancellation?: boolean;
          alert_sound_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          cry_sensitivity?: number;
          cry_min_duration_ms?: number;
          video_max_resolution?: string;
          video_max_framerate?: number;
          audio_noise_suppression?: boolean;
          audio_echo_cancellation?: boolean;
          alert_sound_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      device_type_enum: DeviceType;
      session_status_enum: SessionStatus;
      connection_event_type_enum: ConnectionEventType;
    };
    CompositeTypes: Record<string, never>;
  };
}
