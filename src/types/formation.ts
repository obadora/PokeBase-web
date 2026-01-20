/**
 * ポジション編成関連の型定義
 */

import type { Position } from "./position";
import type { TeamMemberWithPokemon } from "./team";

/** 編成状態 */
export interface FormationState {
  starters: Map<Position, TeamMemberWithPokemon | null>;
  bench: TeamMemberWithPokemon[];
}

/** 編成バリデーション結果 */
export interface FormationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** すべてのポジション（表示順序） */
export const ALL_POSITIONS: Position[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
];

/** ポジション配置の座標情報（パーセント） */
export interface PositionCoordinate {
  position: Position;
  x: number; // パーセント
  y: number; // パーセント
}

/** グラウンド上のポジション座標 */
export const FIELD_POSITION_COORDINATES: PositionCoordinate[] = [
  // 外野
  { position: "left", x: 15, y: 15 },
  { position: "center", x: 50, y: 8 },
  { position: "right", x: 85, y: 15 },
  // 内野
  { position: "third", x: 22, y: 45 },
  { position: "short", x: 38, y: 38 },
  { position: "second", x: 62, y: 38 },
  { position: "first", x: 78, y: 45 },
  // バッテリー
  { position: "pitcher", x: 50, y: 55 },
  { position: "catcher", x: 50, y: 82 },
];
