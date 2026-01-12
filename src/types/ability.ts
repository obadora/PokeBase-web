/**
 * 能力値型定義
 */

/** 野手能力型 */
export interface FielderAbility {
  meet: number; // ミート(0-100)
  power: number; // パワー(0-100)
  speed: number; // 走力(0-100)
  arm: number; // 肩力(0-100)
  defense: number; // 守備力(0-100)
  stamina: number; // スタミナ(0-100)
}

/** 投手能力型 */
export interface PitcherAbility {
  velocity: number; // 球速(0-100)
  control: number; // 制球力(0-100)
  stamina: number; // スタミナ(0-100)
  breaking: number; // 変化球(0-100)
}

/** ランク型 */
export type Rank = "SS" | "S" | "A" | "B" | "C" | "D" | "E" | "F" | "G";

/** ランク定義 */
export interface RankDefinition {
  rank: Rank;
  min: number; // 最小値
  max: number; // 最大値
}

/** ランクの閾値定義 */
export const RANK_THRESHOLDS: RankDefinition[] = [
  { rank: "SS", min: 100, max: 999 }, // 100以上（将来の拡張を考慮）
  { rank: "S", min: 90, max: 99 },
  { rank: "A", min: 80, max: 89 },
  { rank: "B", min: 70, max: 79 },
  { rank: "C", min: 60, max: 69 },
  { rank: "D", min: 50, max: 59 },
  { rank: "E", min: 40, max: 49 },
  { rank: "F", min: 20, max: 39 },
  { rank: "G", min: 0, max: 19 },
];
