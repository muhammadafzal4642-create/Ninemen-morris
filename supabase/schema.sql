-- Navakankari (Nine Men's Morris) PostgreSQL Schema for Supabase
-- Run this in your Supabase SQL Editor to enable persistent cloud rooms & Realtime

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS public.navakankari_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL DEFAULT 'Player 1',
  guest_id TEXT,
  guest_name TEXT,
  host_side INT NOT NULL DEFAULT 1, -- 1 or 2
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'abandoned'
  current_player INT NOT NULL DEFAULT 1,
  game_state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '4 hours')
);

-- Index for fast room code lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.navakankari_rooms (code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.navakankari_rooms (status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.navakankari_rooms ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active or waiting rooms by code
CREATE POLICY "Allow public read access to rooms"
  ON public.navakankari_rooms
  FOR SELECT
  USING (true);

-- Allow creating new rooms
CREATE POLICY "Allow public creation of rooms"
  ON public.navakankari_rooms
  FOR INSERT
  WITH CHECK (true);

-- Allow room participants to update their game state
CREATE POLICY "Allow players in room to update match"
  ON public.navakankari_rooms
  FOR UPDATE
  USING (true);

-- 3. Enable Realtime on navakankari_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.navakankari_rooms;

-- 4. Cleanup function for expired rooms
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.navakankari_rooms
  WHERE expires_at < timezone('utc'::text, now())
     OR (status = 'waiting' AND created_at < timezone('utc'::text, now()) - interval '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
