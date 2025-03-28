
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTeam, fetchAllPlayerStats } from '@/services/leagueApi';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Activity, 
  Medal,
  ArrowUpRight
} from 'lucide-react';

const Index = () => {
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam
  });
  
  const { data: playersStats, isLoading: statsLoading } = useQuery({
    queryKey: ['allPlayersStats'],
    queryFn: fetchAllPlayerStats
  });
  
  const isLoading = teamLoading || statsLoading;

  // Calculate winrate
  const winRate = team?.totalWins && team?.totalLosses 
    ? ((team.totalWins / (team.totalWins + team.totalLosses)) * 100).toFixed(1) 
    : '0';

  // Find best performing player based on KDA
  const bestPlayer = playersStats 
    ? Object.entries(playersStats).reduce((best, [id, stats]) => {
        if (!best || (stats.avgKDA || 0) > (playersStats[best]?.avgKDA || 0)) {
          return id;
        }
        return best;
      }, '')
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
          <p className="text-muted-foreground">
            Track your team's performance and statistics
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-24" />
            </Card>
          ))
        ) : (
          <>
            <StatCard 
              title="Team Win Rate" 
              value={`${winRate}%`}
              icon={<Trophy size={18} />}
              change={5.2}
            />
            <StatCard 
              title="Total Wins" 
              value={team?.totalWins || 0}
              icon={<TrendingUp size={18} />}
              valueClassName="text-esports-green"
            />
            <StatCard 
              title="Team Members" 
              value={team?.players.length || 0}
              icon={<Users size={18} />}
            />
            <StatCard 
              title="Average KDA" 
              value={
                playersStats 
                  ? (Object.values(playersStats).reduce((sum, stats) => sum + (stats.avgKDA || 0), 0) / Object.values(playersStats).length).toFixed(2)
                  : '0'
              }
              icon={<Activity size={18} />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Player Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse h-10 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {team?.players.map((player, i) => {
                  const stats = playersStats?.[player.id];
                  return (
                    <Link 
                      key={player.id} 
                      to={`/player/${player.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div>{stats?.avgKDA?.toFixed(2) || '0'} KDA</div>
                        <div className="text-sm text-muted-foreground">
                          {stats?.winRate || 0}% WR
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {bestPlayer && playersStats && (
                  <div className="bg-accent/20 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Medal className="text-esports-yellow" />
                        <div className="font-medium">Top Performer</div>
                      </div>
                      <Link to={`/player/${bestPlayer}`} className="text-primary flex items-center hover:underline">
                        View <ArrowUpRight size={14} className="ml-1" />
                      </Link>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="font-medium">
                          {team?.players.find(p => p.id === bestPlayer)?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground ml-2">
                          ({team?.players.find(p => p.id === bestPlayer)?.role || 'Unknown'})
                        </div>
                      </div>
                      <div className="text-sm mt-1">
                        {playersStats[bestPlayer]?.avgKDA?.toFixed(2) || '0'} KDA | {playersStats[bestPlayer]?.winRate || 0}% Win Rate
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-accent/20 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-esports-green" />
                      <div className="font-medium">Team Progress</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="font-medium">
                      {team?.totalWins || 0} wins in {(team?.totalWins || 0) + (team?.totalLosses || 0)} matches
                    </div>
                    <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-esports-green" 
                        style={{ 
                          width: `${team?.totalWins && team?.totalLosses 
                            ? ((team.totalWins / (team.totalWins + team.totalLosses)) * 100) 
                            : 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-accent/20 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Activity className="text-esports-violet" />
                      <div className="font-medium">Recent Performance</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {/* Simulating recent games */}
                      {Array(10).fill(0).map((_, i) => {
                        const isWin = Math.random() > 0.4;
                        return (
                          <div 
                            key={i} 
                            className={`w-4 h-4 rounded-sm ${isWin ? 'bg-esports-green' : 'bg-esports-red'}`}
                            title={isWin ? 'Win' : 'Loss'}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
