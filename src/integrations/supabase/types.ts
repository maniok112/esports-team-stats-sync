export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      champion_stats: {
        Row: {
          assists: number | null
          champion_id: number
          champion_name: string
          created_at: string | null
          cs_per_min: number | null
          deaths: number | null
          games: number | null
          id: string
          kda: number | null
          kills: number | null
          losses: number | null
          player_id: string | null
          updated_at: string | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          assists?: number | null
          champion_id: number
          champion_name: string
          created_at?: string | null
          cs_per_min?: number | null
          deaths?: number | null
          games?: number | null
          id?: string
          kda?: number | null
          kills?: number | null
          losses?: number | null
          player_id?: string | null
          updated_at?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          assists?: number | null
          champion_id?: number
          champion_name?: string
          created_at?: string | null
          cs_per_min?: number | null
          deaths?: number | null
          games?: number | null
          id?: string
          kda?: number | null
          kills?: number | null
          losses?: number | null
          player_id?: string | null
          updated_at?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "champion_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          assists: number | null
          champion: string
          champion_id: number
          created_at: string | null
          cs: number | null
          cs_per_min: number | null
          deaths: number | null
          duration: number | null
          game_id: string
          gold: number | null
          id: string
          kda: number | null
          kills: number | null
          player_id: string | null
          result: string
          role: string | null
          timestamp: number | null
          updated_at: string | null
          vision: number | null
        }
        Insert: {
          assists?: number | null
          champion: string
          champion_id: number
          created_at?: string | null
          cs?: number | null
          cs_per_min?: number | null
          deaths?: number | null
          duration?: number | null
          game_id: string
          gold?: number | null
          id?: string
          kda?: number | null
          kills?: number | null
          player_id?: string | null
          result: string
          role?: string | null
          timestamp?: number | null
          updated_at?: string | null
          vision?: number | null
        }
        Update: {
          assists?: number | null
          champion?: string
          champion_id?: number
          created_at?: string | null
          cs?: number | null
          cs_per_min?: number | null
          deaths?: number | null
          duration?: number | null
          game_id?: string
          gold?: number | null
          id?: string
          kda?: number | null
          kills?: number | null
          player_id?: string | null
          result?: string
          role?: string | null
          timestamp?: number | null
          updated_at?: string | null
          vision?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          avg_assists: number | null
          avg_cs_per_min: number | null
          avg_deaths: number | null
          avg_kda: number | null
          avg_kills: number | null
          created_at: string | null
          id: string
          league_points: number | null
          losses: number | null
          player_id: string | null
          rank: string | null
          roles_played: Json | null
          summoner_name: string | null
          tier: string | null
          updated_at: string | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_assists?: number | null
          avg_cs_per_min?: number | null
          avg_deaths?: number | null
          avg_kda?: number | null
          avg_kills?: number | null
          created_at?: string | null
          id?: string
          league_points?: number | null
          losses?: number | null
          player_id?: string | null
          rank?: string | null
          roles_played?: Json | null
          summoner_name?: string | null
          tier?: string | null
          updated_at?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_assists?: number | null
          avg_cs_per_min?: number | null
          avg_deaths?: number | null
          avg_kda?: number | null
          avg_kills?: number | null
          created_at?: string | null
          id?: string
          league_points?: number | null
          losses?: number | null
          player_id?: string | null
          rank?: string | null
          roles_played?: Json | null
          summoner_name?: string | null
          tier?: string | null
          updated_at?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          id: string
          league_points: number | null
          losses: number | null
          name: string
          profile_icon_id: number | null
          profile_image_url: string | null
          rank: string | null
          role: string
          summoner_id: string | null
          summoner_name: string
          tier: string | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          league_points?: number | null
          losses?: number | null
          name: string
          profile_icon_id?: number | null
          profile_image_url?: string | null
          rank?: string | null
          role: string
          summoner_id?: string | null
          summoner_name: string
          tier?: string | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          league_points?: number | null
          losses?: number | null
          name?: string
          profile_icon_id?: number | null
          profile_image_url?: string | null
          rank?: string | null
          role?: string
          summoner_id?: string | null
          summoner_name?: string
          tier?: string | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      team_stats: {
        Row: {
          created_at: string | null
          id: string
          name: string
          total_losses: number | null
          total_wins: number | null
          updated_at: string | null
          win_rate: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          total_losses?: number | null
          total_wins?: number | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          total_losses?: number | null
          total_wins?: number | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
