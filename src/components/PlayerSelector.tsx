
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Player, Role } from '@/types/league';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const roleOrder: Role[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

export const PlayerSelector = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('role');

        if (error) {
          throw error;
        }

        if (data) {
          // Convert data to Player[] type
          const typedPlayers: Player[] = data.map(player => ({
            id: player.id,
            name: player.name,
            role: player.role as Role,
            summoner_name: player.summoner_name,
            profile_image_url: player.profile_image_url,
            profileIconId: player.profile_icon_id,
            tier: player.tier,
            rank: player.rank,
            leaguePoints: player.league_points,
            wins: player.wins,
            losses: player.losses
          }));
          
          // Sort by role according to roleOrder
          typedPlayers.sort((a, b) => {
            return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
          });
          
          setPlayers(typedPlayers);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, []);

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayer(playerId);
    navigate(`/player/${playerId}`);
  };

  return (
    <Select value={selectedPlayer} onValueChange={handlePlayerChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id}>
            {player.role}: {player.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
