/**
 * チーム作成・メンバー管理の型定義
 */

import type { Pokemon } from "./index";
import type { Position } from "./position";

/** データベースのチーム型（supabase.tsと同期） */
export interface Team {
  id: string;
  user_id: string;
  team_name: string;
  reputation: number;
  created_at: string;
  updated_at: string;
}

/** 学年型 */
export type Grade = 1 | 2 | 3;

/** 学年の日本語名 */
export const GRADE_NAMES_JA: Record<Grade, string> = {
  1: "1年生",
  2: "2年生",
  3: "3年生",
};

/** データベースのチームメンバー型（supabase.tsと同期） */
export interface TeamMember {
  id: string;
  team_id: string;
  pokemon_id: number;
  position: string;
  is_starter: boolean;
  join_date: string;
  grade: Grade;
  batting_order: number | null;
}

/** ポケモン情報を含むチームメンバー型 */
export interface TeamMemberWithPokemon extends TeamMember {
  pokemon: Pokemon;
}

/** チーム作成フォーム入力型 */
export interface TeamCreationInput {
  teamName: string;
  members: MemberSlotState[];
}

/** メンバースロット状態型 */
export interface MemberSlotState {
  position: Position;
  pokemon: Pokemon | null;
  isRequired: boolean;
}

/** ポジションカテゴリ */
export type PositionCategory = "battery" | "infield" | "outfield";

/** ポジションカテゴリ別のポジション定義 */
export const POSITION_CATEGORIES: Record<PositionCategory, Position[]> = {
  battery: ["pitcher", "catcher"],
  infield: ["first", "second", "third", "short"],
  outfield: ["left", "center", "right"],
};

/** ポジションカテゴリの日本語名 */
export const POSITION_CATEGORY_NAMES_JA: Record<PositionCategory, string> = {
  battery: "バッテリー",
  infield: "内野手",
  outfield: "外野手",
};

/** チーム構成バリデーションルール */
export interface TeamValidationRules {
  minMembers: number;
  maxMembers: number;
  battery: { pitcher: number; catcher: number };
  infield: { min: number; max: number };
  outfield: { min: number; max: number };
}

/** デフォルトのチーム構成ルール */
export const DEFAULT_TEAM_RULES: TeamValidationRules = {
  minMembers: 6,
  maxMembers: 6,
  battery: { pitcher: 1, catcher: 1 },
  infield: { min: 2, max: 3 },
  outfield: { min: 1, max: 2 },
};

/** チームバリデーション結果 */
export interface TeamValidationResult {
  isValid: boolean;
  errors: string[];
}
