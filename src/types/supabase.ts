
import { Player, Match, PlayerStats, ChampionStats, TeamStats } from './league';

/**
 * Interface for Supabase tables
 */
export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player & {
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Player, 'id'> & { 
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Player> & { 
          updated_at?: string;
        };
      };
      team_stats: {
        Row: Omit<TeamStats, 'players'> & {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Omit<TeamStats, 'players'> & { 
          name: string;
          created_at?: string;
          updated_at?: string;
        }, 'id'>;
        Update: Partial<Omit<TeamStats, 'players'>> & { 
          name?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: Match & {
          player_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Match, 'id'> & { 
          player_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Match> & { 
          updated_at?: string;
        };
      };
      champion_stats: {
        Row: ChampionStats & {
          id: string;
          player_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<ChampionStats, 'id'> & { 
          player_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ChampionStats> & { 
          updated_at?: string;
        };
      };
      player_stats: {
        Row: Omit<PlayerStats, 'recentMatches' | 'championStats'> & {
          id: string;
          player_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Omit<PlayerStats, 'recentMatches' | 'championStats'>, 'id'> & { 
          player_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PlayerStats, 'recentMatches' | 'championStats'>> & { 
          updated_at?: string;
        };
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      sync_riot_data: {
        Args: { summonerName: string };
        Returns: { success: boolean; message: string };
      };
      import_csv_data: {
        Args: { csv_data: string };
        Returns: { success: boolean; message: string };
      };
    };
  };
}

/**
 * Riot API response types
 */
export interface RiotSummonerResponse {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntryResponse {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface RiotMatchResponse {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameId: number;
    participants: Array<{
      assists: number;
      champLevel: number;
      championId: number;
      championName: string;
      deaths: number;
      goldEarned: number;
      kills: number;
      participantId: number;
      puuid: string;
      totalMinionsKilled: number;
      visionScore: number;
      win: boolean;
    }>;
  };
}
