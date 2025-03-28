
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Match } from '@/types/league';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MatchHistoryCardProps {
  matches: Match[];
  className?: string;
}

export const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ matches, className }) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Champion</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">K/D/A</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">CS</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Result</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">Time</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 champion-icon border-accent">
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/${match.champion}.png`} 
                          alt={match.champion}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/Aatrox.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{match.champion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {match.kills}/{match.deaths}/{match.assists} 
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({match.kda.toFixed(1)})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {match.cs} 
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({match.csPerMin}/min)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={match.result === 'win' ? 'win' : 'loss'}>
                      {match.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(match.timestamp), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
