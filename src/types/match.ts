/**
 * 試合シミュレーション関連の型定義
 */

import type { Position } from "./position";

/** 塁上のランナー情報 */
export interface BaseRunner {
  batterIndex: number;
  name: string;
  spriteUrl: string | null;
}

/** 塁の状態 */
export interface BasesState {
  first: BaseRunner | null;
  second: BaseRunner | null;
  third: BaseRunner | null;
}

/** 試合結果 */
export type MatchResultType = "win" | "lose";

/** イニングスコア */
export interface InningScore {
  inning: number;
  teamAScore: number;
  teamBScore: number;
  /** 自チームのイニングヒット数 */
  teamAHits: number;
  /** 相手チームのイニングヒット数 */
  teamBHits: number;
  /** 自チームのイニングエラー数 */
  teamAErrors: number;
  /** 相手チームのイニングエラー数 */
  teamBErrors: number;
  /** 9回裏がスキップされたか（後攻リードで攻撃なし）- teamA=後攻 */
  teamASkipped?: boolean;
}

/** チーム統計 */
export interface TeamStats {
  /** 得点 */
  runs: number;
  /** ヒット数 */
  hits: number;
  /** エラー数 */
  errors: number;
}

/** 試合結果 */
export interface MatchResult {
  /** 自チームのスコア */
  teamAScore: number;
  /** 相手チームのスコア */
  teamBScore: number;
  /** 勝者（"A" = 自チーム, "B" = 相手チーム, "draw" = 引き分け） */
  winner: "A" | "B" | "draw";
  /** イニング別スコア */
  innings: InningScore[];
  /** 試合のハイライト */
  highlights: MatchHighlight[];
  /** 自チームの統計 */
  teamAStats: TeamStats;
  /** 相手チームの統計 */
  teamBStats: TeamStats;
  /** 自チーム打者成績 */
  teamABatters?: BatterStats[];
  /** 相手チーム打者成績 */
  teamBBatters?: BatterStats[];
  /** 自チーム投手成績 */
  teamAPitcher?: PitcherStats;
  /** 相手チーム投手成績 */
  teamBPitcher?: PitcherStats;
}

/** 試合ハイライト */
export interface MatchHighlight {
  inning: number;
  description: string;
  type: "hit" | "homerun" | "strikeout" | "defense" | "error";
}

/** 打席結果の種類 */
export type AtBatResult =
  | "single" // 単打
  | "double" // 二塁打
  | "triple" // 三塁打
  | "homerun" // 本塁打
  | "strikeout" // 三振
  // ゴロアウト（ポジション別）
  | "groundout_pitcher" // ピッチャーゴロ
  | "groundout_catcher" // キャッチャーゴロ
  | "groundout_first" // ファーストゴロ
  | "groundout_second" // セカンドゴロ
  | "groundout_third" // サードゴロ
  | "groundout_shortstop" // ショートゴロ
  // フライアウト（ポジション別）
  | "flyout_pitcher" // ピッチャーフライ
  | "flyout_catcher" // キャッチャーフライ
  | "flyout_first" // ファーストフライ
  | "flyout_second" // セカンドフライ
  | "flyout_third" // サードフライ
  | "flyout_shortstop" // ショートフライ
  | "flyout_left" // レフトフライ
  | "flyout_center" // センターフライ
  | "flyout_right" // ライトフライ
  | "walk" // 四球
  | "hitByPitch" // 死球
  | "sacrifice" // 犠打
  | "sacrificeFly" // 犠飛
  | "error"; // 失策

/** 打席結果の日本語表示 */
export const AT_BAT_RESULT_LABELS: Record<AtBatResult, string> = {
  single: "安打",
  double: "二塁打",
  triple: "三塁打",
  homerun: "本塁打",
  strikeout: "三振",
  // ゴロアウト
  groundout_pitcher: "投ゴロ",
  groundout_catcher: "捕ゴロ",
  groundout_first: "一ゴロ",
  groundout_second: "二ゴロ",
  groundout_third: "三ゴロ",
  groundout_shortstop: "遊ゴロ",
  // フライアウト
  flyout_pitcher: "投フライ",
  flyout_catcher: "捕フライ",
  flyout_first: "一フライ",
  flyout_second: "二フライ",
  flyout_third: "三フライ",
  flyout_shortstop: "遊フライ",
  flyout_left: "左フライ",
  flyout_center: "中フライ",
  flyout_right: "右フライ",
  walk: "四球",
  hitByPitch: "死球",
  sacrifice: "犠打",
  sacrificeFly: "犠飛",
  error: "失策",
};

/** ゴロアウトの結果一覧 */
export const GROUNDOUT_RESULTS: AtBatResult[] = [
  "groundout_pitcher",
  "groundout_catcher",
  "groundout_first",
  "groundout_second",
  "groundout_third",
  "groundout_shortstop",
];

/** フライアウトの結果一覧 */
export const FLYOUT_RESULTS: AtBatResult[] = [
  "flyout_pitcher",
  "flyout_catcher",
  "flyout_first",
  "flyout_second",
  "flyout_third",
  "flyout_shortstop",
  "flyout_left",
  "flyout_center",
  "flyout_right",
];

/** ゴロアウトかどうか判定 */
export function isGroundout(result: AtBatResult): boolean {
  return GROUNDOUT_RESULTS.includes(result);
}

/** フライアウトかどうか判定 */
export function isFlyout(result: AtBatResult): boolean {
  return FLYOUT_RESULTS.includes(result);
}

/** 打者の打席結果（1打席分） */
export interface AtBat {
  inning: number;
  result: AtBatResult;
  rpiChance?: boolean; // 得点機会（走者あり）
  rbi: number; // 打点
  run: boolean; // 得点したか
  stolenBase: boolean; // 盗塁
  caughtStealing: boolean; // 盗塁死
  /** 打席前のアウトカウント */
  outsBeforeAtBat?: number;
  /** 打席後のアウトカウント */
  outsAfterAtBat?: number;
  /** 打席前の塁状態 */
  basesBeforeAtBat?: BasesState;
  /** 打席後の塁状態 */
  basesAfterAtBat?: BasesState;
  /** 打者情報 */
  batter?: {
    index: number;
    name: string;
    spriteUrl: string | null;
  };
  /** 得点したランナー */
  scoredRunners?: BaseRunner[];
  /** ハーフイニング内の打席順序（0始まり） */
  atBatOrderInHalfInning?: number;
}

/** 打者の試合成績 */
export interface BatterStats {
  playerId: string;
  playerName: string;
  position: string;
  battingOrder: number;
  atBats: AtBat[]; // 全打席結果
  // 集計値
  plateAppearances: number; // 打席数
  atBatCount: number; // 打数（犠打・犠飛・四球・死球除く）
  hits: number; // 安打
  doubles: number; // 二塁打
  triples: number; // 三塁打
  homeruns: number; // 本塁打
  rbi: number; // 打点
  runs: number; // 得点
  strikeouts: number; // 三振
  walks: number; // 四球
  hitByPitch: number; // 死球
  sacrificeHits: number; // 犠打
  sacrificeFlies: number; // 犠飛
  stolenBases: number; // 盗塁
  caughtStealing: number; // 盗塁死
  errors: number; // 失策
}

/** 投手の試合成績 */
export interface PitcherStats {
  playerId: string;
  playerName: string;
  // 投球成績
  inningsPitched: number; // 投球回（3で割った余りが端数）
  inningsPitchedDisplay: string; // 表示用（例: "7.0", "6.2"）
  battersFaced: number; // 対戦打者数
  pitchCount: number; // 球数
  hits: number; // 被安打
  homeruns: number; // 被本塁打
  strikeouts: number; // 奪三振
  walks: number; // 与四球
  hitByPitch: number; // 与死球
  wildPitches: number; // 暴投
  runs: number; // 失点
  earnedRuns: number; // 自責点
}

/** 対戦相手チーム */
export interface OpponentTeam {
  name: string;
  power: number;
  members: OpponentMember[];
}

/** 対戦相手チームメンバー */
export interface OpponentMember {
  name: string;
  position: Position;
  power: number;
  /** ポケモンID（オプション） */
  pokemonId?: number;
  /** ポケモン画像URL（オプション） */
  spriteUrl?: string | null;
}

/** チーム戦力情報 */
export interface TeamPower {
  /** 総合戦力 */
  total: number;
  /** 攻撃力 */
  offense: number;
  /** 守備力 */
  defense: number;
  /** 投手力 */
  pitching: number;
}

/** 試合設定 */
export interface MatchConfig {
  /** イニング数（デフォルト9） */
  innings: number;
  /** ランダム要素の最大値 */
  randomFactor: number;
}

/** デフォルトの試合設定 */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  innings: 9,
  randomFactor: 5,
};
