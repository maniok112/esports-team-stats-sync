
import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Player } from '@/types/league';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type PlayerSelectorProps = {
  onSelectPlayer: (playerId: string) => void;
  selectedPlayerId?: string;
};

const PlayerSelector = ({ onSelectPlayer, selectedPlayerId }: PlayerSelectorProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPlayerDialog, setShowNewPlayerDialog] = useState(false);
  
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setPlayers(data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // Find the currently selected player
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select 
            value={selectedPlayerId} 
            onValueChange={onSelectPlayer}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player to edit">
                {selectedPlayer && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={selectedPlayer.profile_image_url || undefined} 
                        alt={selectedPlayer.name} 
                      />
                      <AvatarFallback>{selectedPlayer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{selectedPlayer.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={player.profile_image_url || undefined} 
                        alt={player.name} 
                      />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{player.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showNewPlayerDialog} onOpenChange={setShowNewPlayerDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new player</DialogTitle>
              <DialogDescription>
                This functionality is not implemented yet. 
                Please use the import feature in the main Admin panel.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowNewPlayerDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PlayerSelector;
