
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayer, fetchPlayerStats, syncPlayerStats } from '@/services/leagueApi';
import { StatCard } from '@/components/StatCard';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { ChampionStatsCard } from '@/components/ChampionStatsCard';
import { PerformanceGraph } from '@/components/PerformanceGraph';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  Swords, 
  Shield, 
  Target,
  RefreshCcw 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const tierColors: Record<string, string> = {
  IRON: 'text-gray-400',
  BRONZE: 'text-amber-800',
  SILVER: 'text-gray-300',
  GOLD: 'text-yellow-500',
  PLATINUM: 'text-teal-300',
  DIAMOND: 'text-blue-400',
  MASTER: 'text-purple-500',
  GRANDMASTER: 'text-red-500',
  CHALLENGER: 'text-esports-yellow'
};

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  
  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => fetchPlayer(playerId || ''),
    enabled: !!playerId
  });
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['playerStats', playerId],
    queryFn: () => fetchPlayerStats(playerId || ''),
    enabled: !!playerId
  });
  
  const isLoading = playerLoading || statsLoading;

  const handleSyncStats = async () => {
    if (!player || !player.summoner_name) {
      toast.error('Player does not have a summoner name set. Please update the player profile.');
      return;
    }

    toast.info(`Syncing stats for ${player.name}...`);
    
    try {
      await syncPlayerStats(playerId || '', player.summoner_name);
      toast.success('Stats synchronized successfully!');
      refetchStats();
    } catch (error) {
      console.error('Error syncing stats:', error);
      toast.error('Failed to sync stats. Please try again later.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 w-48 bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-24" />
            </Card>
          ))}
        </div>
        <div className="animate-pulse h-96 bg-muted rounded"></div>
      </div>
    );
  }
  
  if (!player) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Player not found. Please check the URL and try again.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src={player.profile_image_url || `https://ddragon.leagueoflegends.com/cdn/13.9.1/img/profileicon/${player.profileIconId || 1}.png`} 
                alt="Profile Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {player.name}
                {player.summoner_name && (
                  <span className="text-muted-foreground text-sm font-normal">
                    ({player.summoner_name})
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{player.role}</span>
                {player.tier && (
                  <span className={`font-medium ${tierColors[player.tier] || ''}`}>
                    {player.tier} {player.rank} - {player.leaguePoints} LP
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSyncStats}
          disabled={!player.summoner_name}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Sync Stats
        </Button>
      </div>

      {!stats ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground mb-4">
            No stats available for this player. {player.summoner_name ? 'Try syncing stats from Riot API.' : 'Please add a summoner name to this player profile first.'}
          </p>
          
          {player.summoner_name && (
            <Button onClick={handleSyncStats}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Sync Stats Now
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Win Rate" 
              value={`${stats.win_rate?.toFixed(1) || 0}%`}
              icon={<Award size={18} />}
            />
            <StatCard 
              title="KDA Ratio" 
              value={(stats.avg_kda || 0).toFixed(2)}
              icon={<Swords size={18} />}
            />
            <StatCard 
              title="Avg. CS per min" 
              value={(stats.avg_cs_per_min || 0).toFixed(1)}
              icon={<Target size={18} />}
            />
            <StatCard 
              title="Win/Loss" 
              value={`${stats.wins || 0}W ${stats.losses || 0}L`}
              icon={<Shield size={18} />}
              valueClassName=""
            />
          </div>

          {stats.recentMatches && stats.recentMatches.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <PerformanceGraph 
                matches={stats.recentMatches} 
                metric="kda" 
                title="KDA Performance"
              />
              <PerformanceGraph 
                matches={stats.recentMatches} 
                metric="csPerMin" 
                title="CS per Minute"
              />
            </div>
          )}

          {stats.championStats && stats.championStats.length > 0 && (
            <ChampionStatsCard championStats={stats.championStats} />
          )}
          
          {stats.recentMatches && stats.recentMatches.length > 0 && (
            <MatchHistoryCard matches={stats.recentMatches} />
          )}
        </>
      )}
    </div>
  );
};

export default PlayerProfile;
