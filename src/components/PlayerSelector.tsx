
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTeam } from '@/services/leagueApi';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

export function PlayerSelector() {
  const navigate = useNavigate();
  
  const { data: team, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam
  });
  
  const handlePlayerSelect = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }
  
  return (
    <Select onValueChange={handlePlayerSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {team?.players.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              <div className="flex items-center">
                {player.profile_image_url ? (
                  <img 
                    src={player.profile_image_url} 
                    alt="" 
                    className="w-5 h-5 rounded-full mr-2"
                  />
                ) : player.profileIconId ? (
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/13.9.1/img/profileicon/${player.profileIconId}.png`} 
                    alt="" 
                    className="w-5 h-5 rounded-full mr-2"
                  />
                ) : null}
                {player.name} - {player.role}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
