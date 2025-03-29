-- Allow public read access to player_stats table
CREATE POLICY "Allow public read access to player_stats"
  ON public.player_stats
  FOR SELECT
  TO public
  USING (true);
