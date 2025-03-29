
export type Role = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';

export interface Player {
  id: string;
  name: string;
  role: Role;
  summoner_name: string;
  profile_image_url?: string | null;
  profileIconId?: number | null;
  tier?: string | null;
  rank?: string | null;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
}

export interface Match {
  id: string;
  gameId: string;
  timestamp: number;
  champion: string;
  championId: number;
  result: 'win' | 'loss';
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMin: number;
  vision: number;
  gold: number;
  duration: number;
  role?: Role;
}

export interface ChampionStats {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  csPerMin: number;
}

export interface PlayerStats {
  summonerName?: string;
  tier?: string | null;
  rank?: string | null;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  avgKills?: number;
  avgDeaths?: number;
  avgAssists?: number;
  avgKDA?: number;
  avgCsPerMin?: number;
  recentMatches: Match[];
  championStats: ChampionStats[];
}

export interface TeamStats {
  players: Player[];
  totalWins: number;
  totalLosses: number;
  winRate: number;
}
