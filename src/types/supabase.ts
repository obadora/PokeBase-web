/**
 * Supabaseデータベースの型定義
 * テーブル作成後に自動生成される型を手動で定義
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          user_id: string;
          team_name: string;
          reputation: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_name: string;
          reputation?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_name?: string;
          reputation?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          pokemon_id: number;
          position: string;
          is_starter: boolean;
          join_date: string;
          grade: number;
          batting_order: number | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          pokemon_id: number;
          position: string;
          is_starter?: boolean;
          join_date?: string;
          grade?: number;
          batting_order?: number | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          pokemon_id?: number;
          position?: string;
          is_starter?: boolean;
          join_date?: string;
          grade?: number;
          batting_order?: number | null;
        };
      };
      tournaments: {
        Row: {
          id: string;
          team_id: string;
          tournament_type: "district" | "regional" | "national";
          status: "in_progress" | "completed" | "failed";
          current_round: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          tournament_type: "district" | "regional" | "national";
          status?: "in_progress" | "completed" | "failed";
          current_round?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          tournament_type?: "district" | "regional" | "national";
          status?: "in_progress" | "completed" | "failed";
          current_round?: number;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          opponent_name: string;
          result: "win" | "lose";
          score: string;
          date: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          opponent_name: string;
          result: "win" | "lose";
          score: string;
          date?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          opponent_name?: string;
          result?: "win" | "lose";
          score?: string;
          date?: string;
        };
      };
      pokemon: {
        Row: {
          id: number;
          name: string;
          name_ja: string | null;
          height: number;
          weight: number;
          base_experience: number | null;
          species_url: string | null;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          name_ja?: string | null;
          height?: number;
          weight?: number;
          base_experience?: number | null;
          species_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          name_ja?: string | null;
          height?: number;
          weight?: number;
          base_experience?: number | null;
          species_url?: string | null;
          created_at?: string;
        };
      };
      pokemon_stats: {
        Row: {
          id: number;
          pokemon_id: number;
          hp: number;
          attack: number;
          defense: number;
          special_attack: number;
          special_defense: number;
          speed: number;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          hp?: number;
          attack?: number;
          defense?: number;
          special_attack?: number;
          special_defense?: number;
          speed?: number;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          hp?: number;
          attack?: number;
          defense?: number;
          special_attack?: number;
          special_defense?: number;
          speed?: number;
        };
      };
      pokemon_types: {
        Row: {
          id: number;
          pokemon_id: number;
          slot: number;
          type_name: string;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          slot: number;
          type_name: string;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          slot?: number;
          type_name?: string;
        };
      };
      pokemon_abilities: {
        Row: {
          id: number;
          pokemon_id: number;
          slot: number;
          ability_name: string;
          is_hidden: boolean;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          slot: number;
          ability_name: string;
          is_hidden?: boolean;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          slot?: number;
          ability_name?: string;
          is_hidden?: boolean;
        };
      };
      pokemon_sprites: {
        Row: {
          id: number;
          pokemon_id: number;
          front_default: string | null;
          front_shiny: string | null;
          front_female: string | null;
          front_shiny_female: string | null;
          back_default: string | null;
          back_shiny: string | null;
          back_female: string | null;
          back_shiny_female: string | null;
          official_artwork: string | null;
          official_artwork_shiny: string | null;
          home_front_default: string | null;
          home_front_shiny: string | null;
        };
        Insert: {
          id?: number;
          pokemon_id: number;
          front_default?: string | null;
          front_shiny?: string | null;
          front_female?: string | null;
          front_shiny_female?: string | null;
          back_default?: string | null;
          back_shiny?: string | null;
          back_female?: string | null;
          back_shiny_female?: string | null;
          official_artwork?: string | null;
          official_artwork_shiny?: string | null;
          home_front_default?: string | null;
          home_front_shiny?: string | null;
        };
        Update: {
          id?: number;
          pokemon_id?: number;
          front_default?: string | null;
          front_shiny?: string | null;
          front_female?: string | null;
          front_shiny_female?: string | null;
          back_default?: string | null;
          back_shiny?: string | null;
          back_female?: string | null;
          back_shiny_female?: string | null;
          official_artwork?: string | null;
          official_artwork_shiny?: string | null;
          home_front_default?: string | null;
          home_front_shiny?: string | null;
        };
      };
    };
    Views: {
      pokemon_full: {
        Row: {
          id: number;
          name: string;
          name_ja: string | null;
          height: number;
          weight: number;
          base_experience: number | null;
          species_url: string | null;
          hp: number;
          attack: number;
          defense: number;
          special_attack: number;
          special_defense: number;
          speed: number;
          front_default: string | null;
          front_shiny: string | null;
          official_artwork: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
