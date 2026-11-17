-- ==============================================================================
-- BABYGUARD - Row Level Security (RLS) & Security Policies
-- Absolute Isolation & Owner-Only Access
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES FOR 'devices'
-- Owner can select their own active/revoked devices
CREATE POLICY "Users can view their own devices"
    ON public.devices
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Owner can register devices for their account
CREATE POLICY "Users can insert their own devices"
    ON public.devices
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Owner can update (e.g. revoke, rename, update last_seen_at) their own devices
CREATE POLICY "Users can update their own devices"
    ON public.devices
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own devices
CREATE POLICY "Users can delete their own devices"
    ON public.devices
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. POLICIES FOR 'pairing_codes'
-- Owner can generate and view their own pairing codes
CREATE POLICY "Users can view their own pairing codes"
    ON public.pairing_codes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert pairing codes for their account"
    ON public.pairing_codes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update (mark used/revoked) their own pairing codes"
    ON public.pairing_codes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pairing codes"
    ON public.pairing_codes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. POLICIES FOR 'monitoring_sessions'
-- Only session owner can view and manage their streaming sessions
CREATE POLICY "Users can view their own monitoring sessions"
    ON public.monitoring_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert monitoring sessions"
    ON public.monitoring_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring sessions"
    ON public.monitoring_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. POLICIES FOR 'connection_events'
-- Owner can read their own connection and audit events
CREATE POLICY "Users can view their own connection events"
    ON public.connection_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert connection events"
    ON public.connection_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 6. POLICIES FOR 'user_preferences'
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Trigger to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- 8. Enable Realtime Replication on connection_events and monitoring_sessions
-- so that monitor and station get instant signaling & cry alert events
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_sessions;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_events;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
