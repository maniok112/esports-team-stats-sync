
-- Add profile_image_url column to players table if it doesn't exist
ALTER TABLE IF EXISTS public.players 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add columns to player_stats table if they don't exist
ALTER TABLE IF EXISTS public.player_stats 
ADD COLUMN IF NOT EXISTS summoner_name TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT,
ADD COLUMN IF NOT EXISTS league_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

-- Ensure the database syncs properly
ALTER TABLE IF EXISTS public.players
DROP CONSTRAINT IF EXISTS players_summoner_name_key;

-- Make sure we have unique summoner names
ALTER TABLE IF EXISTS public.players
ADD CONSTRAINT players_summoner_name_key UNIQUE (summoner_name);
