
-- Add profile_image_url column to players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'players'
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE public.players
        ADD COLUMN profile_image_url TEXT DEFAULT NULL;
    END IF;
END
$$;
