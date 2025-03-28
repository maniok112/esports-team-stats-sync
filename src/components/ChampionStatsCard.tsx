
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChampionStats } from '@/types/league';
import { cn } from '@/lib/utils';

interface ChampionStatsCardProps {
  championStats: ChampionStats[];
  className?: string;
}

export const ChampionStatsCard: React.FC<ChampionStatsCardProps> = ({ championStats, className }) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Champion Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Champion</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Games</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Win Rate</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">KDA</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">CS/min</th>
              </tr>
            </thead>
            <tbody>
              {championStats.map((champ) => (
                <tr key={champ.championId} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 champion-icon border-accent">
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/${champ.championName}.png`} 
                          alt={champ.championName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/Aatrox.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{champ.championName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {champ.games} 
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({champ.wins}W {champ.losses}L)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full", 
                            champ.winRate >= 60 ? "bg-esports-green" : 
                            champ.winRate >= 50 ? "bg-esports-yellow" : 
                            "bg-esports-red"
                          )}
                          style={{ width: `${champ.winRate}%` }}
                        ></div>
                      </div>
                      <span>{champ.winRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {champ.kills}/{champ.deaths}/{champ.assists} 
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({champ.kda})
                    </span>
                  </td>
                  <td className="px-4 py-3">{champ.csPerMin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
