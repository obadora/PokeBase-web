/**
 * 試合シミュレーション関連の型定義
 */

import type { Position } from "./position";

/** 試合結果 */
export type MatchResultType = "win" | "lose";

/** イニングスコア */
export interface InningScore {
  inning: number;
  teamAScore: number;
  teamBScore: number;
}

/** 試合結果 */
export interface MatchResult {
  /** 自チームのスコア */
  teamAScore: number;
  /** 相手チームのスコア */
  teamBScore: number;
  /** 勝者（"A" = 自チーム, "B" = 相手チーム） */
  winner: "A" | "B";
  /** イニング別スコア */
  innings: InningScore[];
  /** 試合のハイライト */
  highlights: MatchHighlight[];
}

/** 試合ハイライト */
export interface MatchHighlight {
  inning: number;
  description: string;
  type: "hit" | "homerun" | "strikeout" | "defense" | "error";
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

/** 対戦相手チーム名リスト */
export const OPPONENT_TEAM_NAMES = [
  "草タイプ高校",
  "炎タイプ学園",
  "水タイプ工業",
  "電気タイプ商業",
  "岩タイプ学院",
  "地面タイプ農業",
  "飛行タイプ高校",
  "格闘タイプ大学附属",
  "毒タイプ高校",
  "虫タイプ農林",
  "ゴーストタイプ学園",
  "鋼タイプ工科",
  "氷タイプ高校",
  "ドラゴンタイプ学院",
  "悪タイプ商業",
  "エスパータイプ大学附属",
  "フェアリータイプ女学院",
  "ノーマルタイプ総合高校",
];
