-- =========================================================================
-- LifeOS: Autonomous Executive Chief of Staff Database Schema
-- Production Ready for Supabase / PostgreSQL with Row-Level Security (RLS)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACTION CARDS TABLE (Single-card Viewport Deck)
CREATE TYPE action_category_enum AS ENUM ('responses', 'artifacts', 'protocols', 'lifeops');
CREATE TYPE card_status_enum AS ENUM ('pending', 'approved', 'snoozed', 'drafted', 'killed');
CREATE TYPE urgency_enum AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS action_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category action_category_enum NOT NULL DEFAULT 'responses',
    category_label VARCHAR(64) NOT NULL,
    source_context VARCHAR(255) NOT NULL,
    headline TEXT NOT NULL,
    synthesis TEXT NOT NULL,
    urgency urgency_enum NOT NULL DEFAULT 'medium',
    is_keystone BOOLEAN NOT NULL DEFAULT FALSE,
    status card_status_enum NOT NULL DEFAULT 'pending',
    target_entity VARCHAR(255),
    preview_type VARCHAR(32) NOT NULL DEFAULT 'email',
    preview_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    wake_at TIMESTAMPTZ,
    critique_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant deck queries
CREATE INDEX IF NOT EXISTS idx_action_cards_status_urgency ON action_cards(status, urgency, is_keystone);
CREATE INDEX IF NOT EXISTS idx_action_cards_user_created ON action_cards(user_id, created_at DESC);

-- 2. RAW INPUT STREAM TABLE (Omnichannel Ingestion)
CREATE TYPE raw_input_type_enum AS ENUM ('voice', 'document', 'image', 'scratchpad', 'whatsapp');
CREATE TYPE raw_input_status_enum AS ENUM ('processing', 'processed', 'approval_pending');

CREATE TABLE IF NOT EXISTS raw_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type raw_input_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status raw_input_status_enum NOT NULL DEFAULT 'approval_pending',
    duration_seconds INT,
    audio_blob_url TEXT,
    waveform_data JSONB,
    file_meta JSONB,
    resulting_card_id UUID REFERENCES action_cards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROUTINES & DUAL TIMER PLAYERS
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    time_window VARCHAR(64) NOT NULL,
    total_minutes INT NOT NULL DEFAULT 45,
    mode VARCHAR(32) NOT NULL DEFAULT 'Time-Windowed',
    markdown_spec TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active_now BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MISSIONS & NORTH STARS
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    deadline VARCHAR(64),
    progress_percent INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS north_stars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_metric VARCHAR(255) NOT NULL,
    current_progress INT NOT NULL DEFAULT 0,
    leverage_score VARCHAR(16) NOT NULL DEFAULT 'S-Tier',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ACTIVITY FEED & AUDIT LEDGER (With SICK_DAY_PAUSE support)
CREATE TABLE IF NOT EXISTS activity_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    card_title VARCHAR(255) NOT NULL,
    category_label VARCHAR(64),
    details TEXT NOT NULL,
    actor VARCHAR(64) NOT NULL DEFAULT 'Executive Chief of Staff',
    streak_status VARCHAR(32), -- 'COMPLETED', 'SICK_DAY_PAUSE', 'MISSED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE north_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_ledger ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own records
CREATE POLICY "Users can manage their action cards" ON action_cards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their raw inputs" ON raw_inputs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their routines" ON routines
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their missions" ON missions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their north stars" ON north_stars
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their activity ledger" ON activity_ledger
    FOR ALL USING (auth.uid() = user_id);
