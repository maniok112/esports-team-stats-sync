const PlayerProfile = ({ playerId }: { playerId: string }) => {
  const { data: playerStats, isLoading, error } = useQuery(
    ['playerStats', playerId],
    () => fetchPlayerStats(playerId)
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading player stats: {error.message}</div>;
  }

  if (!playerStats) {
    return <div>Player stats not found.</div>; // Handle case where stats are null
  }

  return (
    <div>
      {/* Render player stats */}
      <p>Wins: {playerStats.wins}</p>
      <p>Losses: {playerStats.losses}</p>
      {/* ... */}
    </div>
  );
};
