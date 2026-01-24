/**
 * 対戦相手生成システムの型定義
 */

import type { Pokemon } from "./index";
import type { Position } from "./position";

/** 大会種別 */
export type TournamentType = "district" | "regional" | "national";

/** 大会種別の日本語名 */
export const TOURNAMENT_TYPE_NAMES_JA: Record<TournamentType, string> = {
  district: "地区予選",
  regional: "地方大会",
  national: "全国大会",
};

/** 大会種別の設定 */
export interface TournamentConfig {
  /** チーム数 */
  teamCount: number;
  /** 試合数 */
  matchCount: number;
  /** 平均能力値の最小値 */
  minAverageStats: number;
  /** 平均能力値の最大値 */
  maxAverageStats: number;
  /** タイプ統一チームを生成するか */
  useTypedTeam: boolean;
}

/** 大会種別ごとの設定 */
export const TOURNAMENT_CONFIGS: Record<TournamentType, TournamentConfig> = {
  district: {
    teamCount: 4,
    matchCount: 3,
    minAverageStats: 50,
    maxAverageStats: 60,
    useTypedTeam: true,
  },
  regional: {
    teamCount: 8,
    matchCount: 7,
    minAverageStats: 60,
    maxAverageStats: 75,
    useTypedTeam: true,
  },
  national: {
    teamCount: 16,
    matchCount: 15,
    minAverageStats: 75,
    maxAverageStats: 90,
    useTypedTeam: false,
  },
};

/** 大会報酬設定 */
export interface TournamentReward {
  /** 優勝報酬（評判ポイント） */
  championReward: number;
  /** 1勝ごとの報酬（評判ポイント） */
  winReward: number;
  /** 参加報酬（評判ポイント） */
  participationReward: number;
}

/** 大会種別ごとの報酬設定 */
export const TOURNAMENT_REWARDS: Record<TournamentType, TournamentReward> = {
  district: {
    championReward: 100,
    winReward: 20,
    participationReward: 10,
  },
  regional: {
    championReward: 300,
    winReward: 50,
    participationReward: 30,
  },
  national: {
    championReward: 1000,
    winReward: 100,
    participationReward: 50,
  },
};

/** 大会参加条件 */
export interface TournamentRequirement {
  /** 必要な過去の優勝（nullなら条件なし） */
  requiredChampionship: TournamentType | null;
  /** 最低評判ポイント */
  minReputation: number;
}

/** 大会種別ごとの参加条件 */
export const TOURNAMENT_REQUIREMENTS: Record<TournamentType, TournamentRequirement> = {
  district: {
    requiredChampionship: null,
    minReputation: 0,
  },
  regional: {
    requiredChampionship: "district",
    minReputation: 50,
  },
  national: {
    requiredChampionship: "regional",
    minReputation: 200,
  },
};

/** 対戦相手チームメンバー */
export interface OpponentMember {
  pokemon: Pokemon;
  position: Position;
  battingOrder: number;
}

/** 対戦相手チーム */
export interface OpponentTeam {
  /** チームID（生成時のユニークID） */
  id: string;
  /** チーム名 */
  name: string;
  /** チームのタイプ（タイプ統一の場合） */
  type: string | null;
  /** チームメンバー（9人） */
  members: OpponentMember[];
  /** チーム平均能力値 */
  averageStats: number;
  /** シード番号（トーナメント内の位置） */
  seed: number;
}

/** トーナメント対戦カード */
export interface TournamentMatch {
  /** 対戦ID */
  id: string;
  /** ラウンド番号（1回戦、2回戦...） */
  round: number;
  /** 対戦番号（ラウンド内の順番） */
  matchNumber: number;
  /** チーム1（自チームの場合はnull） */
  team1: OpponentTeam | null;
  /** チーム2（自チームの場合はnull） */
  team2: OpponentTeam | null;
  /** 自チームが参加しているか */
  hasPlayerTeam: boolean;
  /** 勝者（試合後に設定） */
  winner: OpponentTeam | "player" | null;
  /** スコア（試合後に設定） */
  score: string | null;
}

/** トーナメントブラケット */
export interface TournamentBracket {
  /** トーナメントID */
  id: string;
  /** 大会種別 */
  type: TournamentType;
  /** 全ラウンドの対戦カード */
  rounds: TournamentMatch[][];
  /** 参加チーム一覧 */
  teams: OpponentTeam[];
  /** 現在のラウンド */
  currentRound: number;
  /** プレイヤーチームのシード番号 */
  playerSeed: number;
}

/** チーム名生成用のプレフィックス */
export const TEAM_NAME_PREFIXES: string[] = [
  "炎の",
  "雷鳴の",
  "疾風の",
  "氷結の",
  "大地の",
  "蒼天の",
  "暴風の",
  "閃光の",
  "黄金の",
  "銀河の",
  "紅蓮の",
  "漆黒の",
  "翠緑の",
  "紫電の",
  "白銀の",
  "朱雀の",
  "玄武の",
  "青龍の",
  "白虎の",
  "麒麟の",
];

/** チーム名生成用のサフィックス */
export const TEAM_NAME_SUFFIXES: string[] = [
  "フェニックス",
  "ドラゴンズ",
  "サンダース",
  "タイガース",
  "イーグルス",
  "ファイターズ",
  "ウォリアーズ",
  "レイダーズ",
  "ストームズ",
  "ブレイズ",
  "ナイツ",
  "レジェンズ",
  "スターズ",
  "ライオンズ",
  "ホークス",
  "ベアーズ",
  "ウルブズ",
  "パンサーズ",
  "ファルコンズ",
  "シャークス",
];

/** ポケモンタイプ一覧（対戦相手チーム生成用） */
export const POKEMON_TYPES: string[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
