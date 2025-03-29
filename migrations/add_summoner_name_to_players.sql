
-- Add profile_image_url to players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
