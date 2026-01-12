/**
 * Supabaseデータベースの型定義
 * テーブル作成後に自動生成される型を手動で定義
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        };
        Insert: {
          id?: string;
          team_id: string;
          pokemon_id: number;
          position: string;
          is_starter?: boolean;
          join_date?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          pokemon_id?: number;
          position?: string;
          is_starter?: boolean;
          join_date?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          team_id: string;
          tournament_type: 'district' | 'regional' | 'national';
          status: 'in_progress' | 'completed' | 'failed';
          current_round: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          tournament_type: 'district' | 'regional' | 'national';
          status?: 'in_progress' | 'completed' | 'failed';
          current_round?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          tournament_type?: 'district' | 'regional' | 'national';
          status?: 'in_progress' | 'completed' | 'failed';
          current_round?: number;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          opponent_name: string;
          result: 'win' | 'lose';
          score: string;
          date: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          opponent_name: string;
          result: 'win' | 'lose';
          score: string;
          date?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          opponent_name?: string;
          result?: 'win' | 'lose';
          score?: string;
          date?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
