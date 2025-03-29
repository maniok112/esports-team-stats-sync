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
      profile_image_url: data.profile_image_url,
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
    
    // Fallback to mock data if there's an error
    return fallbackToMockPlayer(playerId);
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
      profile_image_url: player.profile_image_url,
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
    
    // Fallback to mock data if there's an error or no data in Supabase yet
    return fallbackToMockTeamData();
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

const MOCK_PLAYERS: Player[] = [
  { 
    id: '1',
    name: 'TheShy',
    role: 'Top',
    summoner_name: 'TheShy',
    profileIconId: 3546,
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 850,
    wins: 120,
    losses: 75
  },
  { 
    id: '2',
    name: 'Canyon',
    role: 'Jungle',
    summoner_name: 'Canyon',
    profileIconId: 5205,
    tier: 'GRANDMASTER',
    rank: 'I',
    leaguePoints: 620,
    wins: 110,
    losses: 90
  },
  { 
    id: '3',
    name: 'Faker',
    role: 'Mid',
    summoner_name: 'Faker',
    profileIconId: 6,
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 1200,
    wins: 180,
    losses: 105
  },
  { 
    id: '4',
    name: 'Ruler',
    role: 'ADC',
    summoner_name: 'Ruler',
    profileIconId: 4567,
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 780,
    wins: 130,
    losses: 85
  },
  { 
    id: '5',
    name: 'Keria',
    role: 'Support',
    summoner_name: 'Keria',
    profileIconId: 4822,
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 750,
    wins: 125,
    losses: 80
  }
];

function fallbackToMockTeamData(): TeamStats {
  return {
    players: MOCK_PLAYERS,
    totalWins: MOCK_PLAYERS.reduce((sum, player) => sum + (player.wins || 0), 0),
    totalLosses: MOCK_PLAYERS.reduce((sum, player) => sum + (player.losses || 0), 0),
    winRate: 0
  };
}

function fallbackToMockPlayer(playerId: string): Player | undefined {
  return MOCK_PLAYERS.find(player => player.id === playerId);
}

function fallbackToMockPlayerStats(playerId: string): PlayerStats | null {
  const player = MOCK_PLAYERS.find(p => p.id === playerId);
  if (!player) return null;
  const matches = generateMatches(playerId);
  return calculatePlayerStats(player, matches);
}

const generateMatches = (playerId: string): Match[] => {
  const champions = [
    { id: 266, name: 'Aatrox' },
    { id: 103, name: 'Ahri' },
    { id: 84, name: 'Akali' },
    { id: 166, name: 'Akshan' },
    { id: 12, name: 'Alistar' },
    { id: 32, name: 'Amumu' },
    { id: 1, name: 'Annie' },
    { id: 22, name: 'Ashe' },
    { id: 136, name: 'Aurelion Sol' },
    { id: 268, name: 'Azir' }
  ];
  
  const matches: Match[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 15; i++) {
    const champion = champions[Math.floor(Math.random() * champions.length)];
    const isWin = Math.random() > 0.4;
    const kills = Math.floor(Math.random() * 12) + 1;
    const deaths = Math.floor(Math.random() * 8) + 1;
    const assists = Math.floor(Math.random() * 15) + 1;
    const kda = deaths === 0 ? kills + assists : parseFloat(((kills + assists) / deaths).toFixed(2));
    const cs = Math.floor(Math.random() * 200) + 120;
    const duration = Math.floor(Math.random() * 20) + 20; // 20-40 minutes
    const csPerMin = parseFloat((cs / duration).toFixed(1));
    
    matches.push({
      id: `match-${playerId}-${i}`,
      gameId: `GM${Math.floor(Math.random() * 10000000)}`,
      timestamp: now - (i * day),
      champion: champion.name,
      championId: champion.id,
      result: isWin ? 'win' : 'loss',
      kills,
      deaths,
      assists,
      kda,
      cs,
      csPerMin,
      vision: Math.floor(Math.random() * 30) + 10,
      gold: Math.floor(Math.random() * 15000) + 8000,
      duration
    });
  }
  return matches;
};

const generateChampionStats = (matches: Match[]): ChampionStats[] => {
  const champMap: Record<number, ChampionStats> = {};
  
  matches.forEach(match => {
    if (!champMap[match.championId]) {
      champMap[match.championId] = {
        championId: match.championId,
        championName: match.champion,
        games: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        kda: 0,
        csPerMin: 0
      };
    }
    const stat = champMap[match.championId];
    stat.games += 1;
    if (match.result === 'win') {
      stat.wins += 1;
    } else {
      stat.losses += 1;
    }
    stat.kills += match.kills;
    stat.deaths += match.deaths;
    stat.assists += match.assists;
    stat.csPerMin += match.csPerMin;
  });
  
  Object.values(champMap).forEach(champ => {
    champ.winRate = parseFloat(((champ.wins / champ.games) * 100).toFixed(1));
    champ.kills = parseFloat((champ.kills / champ.games).toFixed(1));
    champ.deaths = parseFloat((champ.deaths / champ.games).toFixed(1));
    champ.assists = parseFloat((champ.assists / champ.games).toFixed(1));
    champ.kda = champ.deaths > 0 ? 
      parseFloat(((champ.kills + champ.assists) / champ.deaths).toFixed(2)) : 
      parseFloat((champ.kills + champ.assists).toFixed(2));
    champ.csPerMin = parseFloat((champ.csPerMin / champ.games).toFixed(1));
  });
  
  return Object.values(champMap)
    .sort((a, b) => b.games - a.games);
};

const calculatePlayerStats = (player: Player, matches: Match[]): PlayerStats => {
  const totalMatches = matches.length;
  if (totalMatches === 0) {
    return {
      summonerName: player.summoner_name,
      tier: player.tier,
      rank: player.rank,
      leaguePoints: player.leaguePoints,
      wins: player.wins,
      losses: player.losses,
      winRate: player.wins && player.losses ? 
        parseFloat(((player.wins / (player.wins + player.losses)) * 100).toFixed(1)) : 
        undefined,
      recentMatches: [],
      championStats: []
    };
  }
  
  const wins = matches.filter(m => m.result === 'win').length;
  const losses = totalMatches - wins;
  
  const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
  const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
  const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
  const totalCs = matches.reduce((sum, match) => sum + match.cs, 0);
  const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
  
  const avgKills = parseFloat((totalKills / totalMatches).toFixed(1));
  const avgDeaths = parseFloat((totalDeaths / totalMatches).toFixed(1));
  const avgAssists = parseFloat((totalAssists / totalMatches).toFixed(1));
  const avgKDA = avgDeaths > 0 ? 
    parseFloat(((avgKills + avgAssists) / avgDeaths).toFixed(2)) : 
    parseFloat((avgKills + avgAssists).toFixed(2));
  const avgCsPerMin = parseFloat((totalCs / totalDuration).toFixed(1));
  
  const championStats = generateChampionStats(matches);
  
  return {
    summonerName: player.summoner_name,
    tier: player.tier,
    rank: player.rank,
    leaguePoints: player.leaguePoints,
    wins: player.wins,
    losses: player.losses,
    winRate: player.wins && player.losses ? 
      parseFloat(((player.wins / (player.wins + player.losses)) * 100).toFixed(1)) : 
      undefined,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA,
    avgCsPerMin,
    recentMatches: matches,
    championStats
  };
};
