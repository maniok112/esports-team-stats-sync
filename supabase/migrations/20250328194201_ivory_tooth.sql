/*
  # Initial Schema Setup

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `summoner_name` (text, unique)
      - `summoner_id` (text)
      - `profile_icon_id` (integer)
      - `tier` (text)
      - `rank` (text)
      - `league_points` (integer)
      - `wins` (integer)
      - `losses` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `team_stats`
      - `id` (uuid, primary key)
      - `name` (text)
      - `total_wins` (integer)
      - `total_losses` (integer)
      - `win_rate` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `matches`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key)
      - `game_id` (text)
      - `timestamp` (bigint)
      - `champion` (text)
      - `champion_id` (integer)
      - `result` (text)
      - `kills` (integer)
      - `deaths` (integer)
      - `assists` (integer)
      - `kda` (numeric)
      - `cs` (integer)
      - `cs_per_min` (numeric)
      - `vision` (integer)
      - `gold` (integer)
      - `duration` (integer)
      - `role` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `champion_stats`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key)
      - `champion_id` (integer)
      - `champion_name` (text)
      - `games` (integer)
      - `wins` (integer)
      - `losses` (integer)
      - `win_rate` (numeric)
      - `kills` (numeric)
      - `deaths` (numeric)
      - `assists` (numeric)
      - `kda` (numeric)
      - `cs_per_min` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `player_stats`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key)
      - `win_rate` (numeric)
      - `avg_kills` (numeric)
      - `avg_deaths` (numeric)
      - `avg_assists` (numeric)
      - `avg_kda` (numeric)
      - `avg_cs_per_min` (numeric)
      - `roles_played` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for foreign keys and frequently queried columns
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  summoner_name TEXT NOT NULL UNIQUE,
  summoner_id TEXT,
  profile_icon_id INTEGER,
  tier TEXT,
  rank TEXT,
  league_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create team_stats table
CREATE TABLE IF NOT EXISTS public.team_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  timestamp BIGINT,
  champion TEXT NOT NULL,
  champion_id INTEGER NOT NULL,
  result TEXT NOT NULL,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  kda NUMERIC,
  cs INTEGER DEFAULT 0,
  cs_per_min NUMERIC,
  vision INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  duration INTEGER,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create champion_stats table
CREATE TABLE IF NOT EXISTS public.champion_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  champion_id INTEGER NOT NULL,
  champion_name TEXT NOT NULL,
  games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC,
  kills NUMERIC DEFAULT 0,
  deaths NUMERIC DEFAULT 0,
  assists NUMERIC DEFAULT 0,
  kda NUMERIC,
  cs_per_min NUMERIC,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  win_rate NUMERIC,
  avg_kills NUMERIC DEFAULT 0,
  avg_deaths NUMERIC DEFAULT 0,
  avg_assists NUMERIC DEFAULT 0,
  avg_kda NUMERIC,
  avg_cs_per_min NUMERIC,
  roles_played JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_player_id ON public.matches(player_id);
CREATE INDEX IF NOT EXISTS idx_champion_stats_player_id ON public.champion_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON public.player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_game_id ON public.matches(game_id);
CREATE INDEX IF NOT EXISTS idx_players_summoner_name ON public.players(summoner_name);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to players"
  ON public.players
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to team_stats"
  ON public.team_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to matches"
  ON public.matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to champion_stats"
  ON public.champion_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to player_stats"
  ON public.player_stats
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated access to player_stats by player_id" ON public.player_stats;

CREATE POLICY "Allow authenticated access to player_stats by player_id"
  ON public.player_stats
  FOR SELECT
  USING (auth.role() = 'authenticated' AND player_id = current_setting('request.jwt.claims.player_id', true)::uuid);

-- Ensure the policy is applied
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_stats_updated_at
  BEFORE UPDATE ON public.team_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_champion_stats_updated_at
  BEFORE UPDATE ON public.champion_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();