/**
 * ポジション型定義
 */

/** ポジション型 */
export type Position =
  | "pitcher" // 投手
  | "catcher" // 捕手
  | "first" // 一塁手
  | "second" // 二塁手
  | "third" // 三塁手
  | "short" // 遊撃手
  | "left" // 左翼手
  | "center" // 中堅手
  | "right"; // 右翼手

/** ポジション適性型 */
export interface PositionFitness {
  position: Position; // ポジション
  score: number; // 適性スコア(0-100)
  stars: number; // 星の数(1-5)
  rank: number; // 順位(1-9)
}

/** ポジション日本語名マッピング */
export const POSITION_NAMES_JA: Record<Position, string> = {
  pitcher: "投手",
  catcher: "捕手",
  first: "一塁手",
  second: "二塁手",
  third: "三塁手",
  short: "遊撃手",
  left: "左翼手",
  center: "中堅手",
  right: "右翼手",
};

/** ポジション英語名マッピング */
export const POSITION_NAMES_EN: Record<Position, string> = {
  pitcher: "Pitcher",
  catcher: "Catcher",
  first: "First Base",
  second: "Second Base",
  third: "Third Base",
  short: "Shortstop",
  left: "Left Field",
  center: "Center Field",
  right: "Right Field",
};
