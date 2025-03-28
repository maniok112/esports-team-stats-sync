
import { Player, Match, PlayerStats, ChampionStats, TeamStats } from '../types/league';

// Simulated data for development, we'll replace with actual API calls later
const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'TheShy',
    role: 'Top',
    summonerName: 'TheShy',
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
    summonerName: 'Canyon',
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
    summonerName: 'Faker',
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
    summonerName: 'Ruler',
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
    summonerName: 'Keria',
    profileIconId: 4822,
    tier: 'CHALLENGER',
    rank: 'I',
    leaguePoints: 750,
    wins: 125,
    losses: 80
  }
];

// Generate random matches for each player
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

// Generate champion stats based on matches
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
  
  // Calculate averages
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

// Calculate player stats based on matches
const calculatePlayerStats = (player: Player, matches: Match[]): PlayerStats => {
  const totalMatches = matches.length;
  if (totalMatches === 0) {
    return {
      summonerName: player.summonerName,
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
    summonerName: player.summonerName,
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

export const fetchTeam = async (): Promise<TeamStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const playerMatchesMap: Record<string, Match[]> = {};
  MOCK_PLAYERS.forEach(player => {
    playerMatchesMap[player.id] = generateMatches(player.id);
  });
  
  return {
    players: MOCK_PLAYERS,
    totalWins: MOCK_PLAYERS.reduce((sum, player) => sum + (player.wins || 0), 0),
    totalLosses: MOCK_PLAYERS.reduce((sum, player) => sum + (player.losses || 0), 0)
  };
};

export const fetchPlayer = async (playerId: string): Promise<Player | undefined> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return MOCK_PLAYERS.find(player => player.id === playerId);
};

export const fetchPlayerStats = async (playerId: string): Promise<PlayerStats | undefined> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const player = MOCK_PLAYERS.find(p => p.id === playerId);
  if (!player) return undefined;
  
  const matches = generateMatches(playerId);
  return calculatePlayerStats(player, matches);
};

export const fetchAllPlayerStats = async (): Promise<Record<string, PlayerStats>> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const result: Record<string, PlayerStats> = {};
  
  for (const player of MOCK_PLAYERS) {
    const matches = generateMatches(player.id);
    result[player.id] = calculatePlayerStats(player, matches);
  }
  
  return result;
};

// For real implementation we would connect to the Riot API
// Example: https://developer.riotgames.com/apis
/*
export const fetchRankedData = async (summonerId: string, region = 'euw1') => {
  const apiKey = process.env.RIOT_API_KEY;
  const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  return data;
};
*/
