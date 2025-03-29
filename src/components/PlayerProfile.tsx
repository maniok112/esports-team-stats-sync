
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayerStats, syncPlayerStats } from '../services/leagueApi';
import { Button } from './ui/button';
import { toast } from 'sonner';

const PlayerProfile = ({ playerId }: { playerId: string }) => {
  const { data: playerStats, isLoading, error, refetch } = useQuery({
    queryKey: ['playerStats', playerId],
    queryFn: () => fetchPlayerStats(playerId)
  });

  const handleSyncStats = async () => {
    if (!playerStats?.summonerName) {
      toast.error("No summoner name available to sync");
      return;
    }
    
    try {
      await syncPlayerStats(playerId, playerStats.summonerName);
      toast.success("Stats synced successfully");
      refetch();
    } catch (error) {
      console.error("Error syncing stats:", error);
      toast.error("Failed to sync stats from Riot API");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-4 text-red-500">Error loading player stats: {(error as Error).message}</div>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (!playerStats) {
    return (
      <div className="p-4">
        <div className="mb-4">No stats found for this player.</div>
        <Button onClick={handleSyncStats}>Sync Stats from Riot API</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{playerStats.summonerName}'s Stats</h2>
        <Button onClick={handleSyncStats}>Sync Stats</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-accent/20 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Rank</h3>
          <p>{playerStats.tier} {playerStats.rank}</p>
          <p>{playerStats.leaguePoints} LP</p>
        </div>
        
        <div className="bg-accent/20 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Win Rate</h3>
          <p>{playerStats.winRate}%</p>
          <p>{playerStats.wins}W {playerStats.losses}L</p>
        </div>
        
        <div className="bg-accent/20 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Performance</h3>
          <p>KDA: {playerStats.avgKDA?.toFixed(2)}</p>
          <p>CS/min: {playerStats.avgCsPerMin?.toFixed(1)}</p>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Recent Matches</h3>
        <div className="space-y-2">
          {playerStats.recentMatches.slice(0, 5).map(match => (
            <div 
              key={match.id}
              className={`flex items-center p-3 rounded-lg ${match.result === 'win' ? 'bg-green-100/30' : 'bg-red-100/30'}`}
            >
              <div className="w-16 h-16 bg-accent rounded-md mr-4 flex items-center justify-center">
                {match.champion}
              </div>
              <div>
                <div className="font-medium">{match.result.toUpperCase()}</div>
                <div>{match.kills}/{match.deaths}/{match.assists} KDA</div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(match.duration / 60)}m {match.duration % 60}s | {match.csPerMin} CS/min
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
