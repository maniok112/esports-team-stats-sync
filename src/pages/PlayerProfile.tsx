import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayer, fetchPlayerStats } from '@/services/leagueApi';
import { StatCard } from '@/components/StatCard';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { ChampionStatsCard } from '@/components/ChampionStatsCard';
import { PerformanceGraph } from '@/components/PerformanceGraph';
import { 
  Award, 
  Swords, 
  Shield, 
  Zap, 
  Target 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['playerStats', playerId],
    queryFn: () => fetchPlayerStats(playerId || ''), // Wywołanie z poprawioną funkcją
    enabled: !!playerId
  });
  
  const isLoading = playerLoading || statsLoading;
  
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
  
  if (!player || !stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Brak statystyk dla wybranego gracza. Spróbuj zsynchronizować dane z Riot API.</p>
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
                src={`https://ddragon.leagueoflegends.com/cdn/13.9.1/img/profileicon/${player.profileIconId || 1}.png`} 
                alt="Profile Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {player.name}
                <span className="text-muted-foreground text-sm font-normal">
                  ({player.summonerName})
                </span>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Win Rate" 
          value={`${stats.winRate || 0}%`}
          icon={<Award size={18} />}
        />
        <StatCard 
          title="KDA Ratio" 
          value={stats.avgKDA?.toFixed(2) || '0'}
          icon={<Swords size={18} />}
        />
        <StatCard 
          title="Avg. CS per min" 
          value={stats.avgCsPerMin || '0'}
          icon={<Target size={18} />}
        />
        <StatCard 
          title="Win/Loss" 
          value={`${stats.wins || 0}W ${stats.losses || 0}L`}
          icon={<Shield size={18} />}
          valueClassName=""
        />
      </div>

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

      <ChampionStatsCard championStats={stats.championStats} />
      
      <MatchHistoryCard matches={stats.recentMatches} />
    </div>
  );
};

export default PlayerProfile;
