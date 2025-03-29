
-- Add profile_image_url column to the players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'players' 
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE public.players ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- Add missing columns to player_stats if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'summoner_name'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN summoner_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'tier'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN tier TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'rank'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN rank TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'league_points'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN league_points INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'wins'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN wins INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'player_stats' 
        AND column_name = 'losses'
    ) THEN
        ALTER TABLE public.player_stats ADD COLUMN losses INTEGER DEFAULT 0;
    END IF;
END $$;
