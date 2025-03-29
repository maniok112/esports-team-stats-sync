
import { Player, Match, PlayerStats, TeamStats, ChampionStats, Role } from '../types/league';
import { supabase } from '@/integrations/supabase/client';

export const syncWithRiotApi = async (summonerName: string): Promise<{ success: boolean, message?: string }> => {
  try {
    console.log(`Syncing data for summoner: ${summonerName}`);
    
    const { data, error } = await supabase.functions.invoke('riot-api', {
      body: {
        action: 'syncSummonerWithRiotApi',
        summonerName,
      },
    });

    if (error) {
      console.error('Error invoking riot-api for syncWithRiotApi:', error);
      return { success: false, message: error.message };
    }

    if (!data?.success) {
      console.error('Riot API syncWithRiotApi failed:', data?.message);
      return { success: false, message: data?.message || 'Failed to sync with Riot API' };
    }

    console.log('Successfully synced with Riot API:', data);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error in syncWithRiotApi:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const importCsvData = async (csvData: string): Promise<{ success: boolean, message?: string }> => {
  try {
    console.log('Importing CSV data');
    
    const { data, error } = await supabase.functions.invoke('riot-api', {
      body: {
        action: 'importCsvData',
        csvData,
      },
    });

    if (error) {
      console.error('Error invoking riot-api for importCsvData:', error);
      return { success: false, message: error.message };
    }

    if (!data?.success) {
      console.error('CSV import failed:', data?.message);
      return { success: false, message: data?.message || 'Failed to import CSV data' };
    }

    console.log('Successfully imported CSV data:', data);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error in importCsvData:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const syncPlayerStats = async (playerId: string, summonerName: string): Promise<void> => {
  try {
    console.log(`Syncing player stats for player_id: ${playerId}, summonerName: ${summonerName}`);
    
    const { data, error } = await supabase.functions.invoke('riot-api', {
      body: {
        action: 'populatePlayerStats',
        playerId,
        summonerName,
      },
    });

    if (error) {
      console.error('Error invoking riot-api for syncPlayerStats:', error);
      throw error;
    }

    if (!data?.success) {
      console.error('Riot API syncPlayerStats failed:', data?.message);
      throw new Error(data?.message || 'Failed to sync player stats');
    }

    console.log('Player stats synced successfully:', data);
  } catch (error) {
    console.error('Error syncing player stats:', error);
    throw error;
  }
};

export const fetchPlayer = async (playerId: string): Promise<Player | undefined> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (error) throw error;
    
    // Convert database player to our Player type
    const player: Player = {
      id: data.id,
      name: data.name,
      role: data.role as Role,
      summoner_name: data.summoner_name,
      profile_image_url: data.profile_image_url || null,
      profileIconId: data.profile_icon_id,
      tier: data.tier,
      rank: data.rank,
      leaguePoints: data.league_points,
      wins: data.wins,
      losses: data.losses
    };
    
    return player;
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return undefined;
  }
};

export const fetchTeam = async (): Promise<TeamStats> => {
  try {
    // Fetch team stats
    const { data: teamData, error: teamError } = await supabase
      .from('team_stats')
      .select('*')
      .single();
    
    if (teamError) throw teamError;
    
    // Fetch players
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('role');
    
    if (playersError) throw playersError;
    
    // Convert the database role strings to our Role type
    const typedPlayers: Player[] = playersData?.map(player => ({
      id: player.id,
      name: player.name,
      role: player.role as Role,
      summoner_name: player.summoner_name,
      profile_image_url: player.profile_image_url || null,
      profileIconId: player.profile_icon_id,
      tier: player.tier,
      rank: player.rank,
      leaguePoints: player.league_points,
      wins: player.wins,
      losses: player.losses
    })) || [];
    
    return {
      players: typedPlayers,
      totalWins: teamData?.total_wins || 0,
      totalLosses: teamData?.total_losses || 0,
      winRate: teamData?.win_rate || 0
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    // Return empty team stats
    return {
      players: [],
      totalWins: 0,
      totalLosses: 0,
      winRate: 0
    };
  }
};

export const fetchPlayerStats = async (playerId: string): Promise<PlayerStats | null> => {
  try {
    console.log(`Fetching player stats for player_id: ${playerId}`);
    
    // Get player stats
    const { data: statsData, error: statsError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (statsError) {
      console.error(`Error fetching player stats for player_id: ${playerId}`, statsError);
      if (statsError.code === 'PGRST116') {
        console.log('No player stats found, will return null');
        return null;
      }
      throw statsError;
    }

    if (!statsData) {
      console.log(`No player stats found for player_id: ${playerId}`);
      return null;
    }

    // Get recent matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('player_id', playerId)
      .order('timestamp', { ascending: false })
      .limit(15);

    if (matchesError) {
      console.error(`Error fetching matches for player_id: ${playerId}`, matchesError);
      throw matchesError;
    }

    // Get champion stats
    const { data: championData, error: championStatsError } = await supabase
      .from('champion_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('games', { ascending: false });

    if (championStatsError) {
      console.error(`Error fetching champion stats for player_id: ${playerId}`, championStatsError);
      throw championStatsError;
    }

    // Convert database matches to our Match type
    const matches: Match[] = matchesData?.map(match => ({
      id: match.id,
      gameId: match.game_id,
      timestamp: match.timestamp,
      champion: match.champion,
      championId: match.champion_id,
      result: match.result as 'win' | 'loss',
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      kda: match.kda,
      cs: match.cs,
      csPerMin: match.cs_per_min,
      vision: match.vision,
      gold: match.gold,
      duration: match.duration,
      role: match.role as Role
    })) || [];

    // Convert database champion stats to our ChampionStats type
    const championStats: ChampionStats[] = championData?.map(champ => ({
      championId: champ.champion_id,
      championName: champ.champion_name,
      games: champ.games,
      wins: champ.wins,
      losses: champ.losses,
      winRate: champ.win_rate,
      kills: champ.kills,
      deaths: champ.deaths,
      assists: champ.assists,
      kda: champ.kda,
      csPerMin: champ.cs_per_min
    })) || [];

    // Combine all data
    const playerStats: PlayerStats = {
      summonerName: statsData.summoner_name || "",
      tier: statsData.tier || null,
      rank: statsData.rank || null,
      leaguePoints: statsData.league_points || 0,
      wins: statsData.wins || 0,
      losses: statsData.losses || 0,
      winRate: statsData.win_rate || 0,
      avgKills: statsData.avg_kills || 0,
      avgDeaths: statsData.avg_deaths || 0,
      avgAssists: statsData.avg_assists || 0,
      avgKDA: statsData.avg_kda || 0,
      avgCsPerMin: statsData.avg_cs_per_min || 0,
      recentMatches: matches,
      championStats: championStats
    };

    return playerStats;
  } catch (error) {
    console.error(`Unhandled error fetching player stats for player_id: ${playerId}`, error);
    return null;
  }
};

export const fetchAllPlayerStats = async (): Promise<Record<string, PlayerStats>> => {
  try {
    // First, get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, summoner_name');
    
    if (playersError) throw playersError;
    
    if (!players || players.length === 0) {
      console.log('No players found');
      return {};
    }
    
    // Create a map to store player stats by ID
    const playerStatsMap: Record<string, PlayerStats> = {};
    
    // Fetch stats for each player in parallel
    await Promise.all(
      players.map(async (player) => {
        try {
          const stats = await fetchPlayerStats(player.id);
          if (stats) {
            playerStatsMap[player.id] = stats;
          }
        } catch (error) {
          console.error(`Error fetching stats for player ${player.id}:`, error);
          // Continue with other players if one fails
        }
      })
    );
    
    return playerStatsMap;
  } catch (error) {
    console.error('Error fetching all player stats:', error);
    return {};
  }
};
