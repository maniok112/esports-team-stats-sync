/*
  # Insert Initial Players

  1. Data
    - Insert 5 initial players with their basic information
    - Players: TheShy, Canyon, Faker, Ruler, Keria
    - Each player has their role and summoner name set

  2. Notes
    - These are the initial players that will be available in the system
    - Additional players can be added through the admin interface
*/

-- Insert initial players if they don't exist
INSERT INTO public.players (name, role, summoner_name, profile_icon_id, tier, rank, league_points, wins, losses)
VALUES
  ('TheShy', 'Top', 'TheShy', 3546, 'CHALLENGER', 'I', 850, 120, 75),
  ('Canyon', 'Jungle', 'Canyon', 5205, 'GRANDMASTER', 'I', 620, 110, 90),
  ('Faker', 'Mid', 'Faker', 6, 'CHALLENGER', 'I', 1200, 180, 105),
  ('Ruler', 'ADC', 'Ruler', 4567, 'CHALLENGER', 'I', 780, 130, 85),
  ('Keria', 'Support', 'Keria', 4822, 'CHALLENGER', 'I', 750, 125, 80)
ON CONFLICT (summoner_name) DO NOTHING;

-- Insert initial team stats if they don't exist
INSERT INTO public.team_stats (name, total_wins, total_losses, win_rate)
SELECT 
  'Team',
  (SELECT COALESCE(SUM(wins), 0) FROM public.players),
  (SELECT COALESCE(SUM(losses), 0) FROM public.players),
  (SELECT CASE 
    WHEN COALESCE(SUM(wins + losses), 0) > 0 
    THEN (COALESCE(SUM(wins), 0)::numeric / COALESCE(SUM(wins + losses), 0)::numeric) * 100
    ELSE 0
  END FROM public.players)
ON CONFLICT DO NOTHING;