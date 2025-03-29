/*
  # Add RLS Policies for Player Updates

  1. Policies
    - Allow updating players table
    - Allow updating player_stats table
    - Allow updating champion_stats table
    - Allow updating matches table
    - Allow updating team_stats table

  2. Notes
    - These policies will allow public access for now
    - In production, you should restrict this to authenticated users
*/

-- Add policies for players table
CREATE POLICY "Allow public update access to players"
  ON public.players
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to players"
  ON public.players
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policies for player_stats table
CREATE POLICY "Allow public update access to player_stats"
  ON public.player_stats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to player_stats"
  ON public.player_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to player_stats"
  ON public.player_stats
  FOR SELECT
  TO public
  USING (true);

-- Add policies for champion_stats table
CREATE POLICY "Allow public update access to champion_stats"
  ON public.champion_stats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to champion_stats"
  ON public.champion_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policies for matches table
CREATE POLICY "Allow public update access to matches"
  ON public.matches
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to matches"
  ON public.matches
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policies for team_stats table
CREATE POLICY "Allow public update access to team_stats"
  ON public.team_stats
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to team_stats"
  ON public.team_stats
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policies for deleting data
CREATE POLICY "Allow public delete access to champion_stats"
  ON public.champion_stats
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to matches"
  ON public.matches
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to player_stats"
  ON public.player_stats
  FOR DELETE
  TO public
  USING (true);