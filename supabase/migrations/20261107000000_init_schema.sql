-- ==============================================================================
-- BABYGUARD - Database Initialization Schema
-- Privacy & Security First Baby Monitor System
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create ENUM types for devices, sessions and event types
DO $$ BEGIN
    CREATE TYPE device_type_enum AS ENUM ('station', 'monitor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('pending', 'active', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_event_type_enum AS ENUM (
        'device_registered',
        'pairing_generated',
        'pairing_used',
        'device_revoked',
        'session_started',
        'session_ended',
        'webrtc_connected',
        'webrtc_disconnected',
        'webrtc_failed',
        'cry_alert'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. DEVICES TABLE
-- Stores authorized transmitter and monitor devices associated with the owner
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type device_type_enum NOT NULL,
    device_fingerprint VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_fingerprint UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON public.devices(is_active) WHERE is_active = true;

-- 4. PAIRING CODES TABLE
-- Ephemeral, single-use 6-digit cryptographic pairing tokens with short TTL (5 min)
CREATE TABLE IF NOT EXISTS public.pairing_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash VARCHAR(128) NOT NULL,
    target_device_type device_type_enum NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pairing_codes_lookup ON public.pairing_codes(user_id, expires_at) WHERE used_at IS NULL AND is_revoked = false;

-- 5. MONITORING SESSIONS TABLE
-- Tracks active WebRTC streaming sessions between station and monitor
CREATE TABLE IF NOT EXISTS public.monitoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    station_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    monitor_device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    status session_status_enum NOT NULL DEFAULT 'pending',
    signaling_channel_id VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_user ON public.monitoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_active ON public.monitoring_sessions(status) WHERE status = 'active';

-- 6. CONNECTION EVENTS / AUDIT LOG
-- Logs connection lifecycle, alerts and revocations. ZERO media content stored.
CREATE TABLE IF NOT EXISTS public.connection_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.monitoring_sessions(id) ON DELETE SET NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    event_type connection_event_type_enum NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_connection_events_user_time ON public.connection_events(user_id, created_at DESC);

-- 7. USER PREFERENCES TABLE
-- Security, video quality, and cry detection preferences per user
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cry_sensitivity INT NOT NULL DEFAULT 70 CHECK (cry_sensitivity BETWEEN 10 AND 100),
    cry_min_duration_ms INT NOT NULL DEFAULT 1500 CHECK (cry_min_duration_ms BETWEEN 500 AND 10000),
    video_max_resolution VARCHAR(20) NOT NULL DEFAULT '720p',
    video_max_framerate INT NOT NULL DEFAULT 30 CHECK (video_max_framerate BETWEEN 10 AND 60),
    audio_noise_suppression BOOLEAN NOT NULL DEFAULT true,
    audio_echo_cancellation BOOLEAN NOT NULL DEFAULT true,
    alert_sound_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
