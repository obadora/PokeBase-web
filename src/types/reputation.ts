/**
 * 評判システムの型定義と定数
 */

/** 評判ランク名 */
export type ReputationRank = "弱小" | "中堅" | "強豪" | "名門";

/** 評判閾値の定義 */
export interface ReputationThreshold {
  min: number;
  max: number;
  memberLimit: number;
}

/** 評判閾値マップ */
export const REPUTATION_THRESHOLDS: Record<ReputationRank, ReputationThreshold> = {
  弱小: { min: 0, max: 99, memberLimit: 6 },
  中堅: { min: 100, max: 399, memberLimit: 7 },
  強豪: { min: 400, max: 699, memberLimit: 8 },
  名門: { min: 700, max: 999, memberLimit: 9 },
};

/** 評判ポイント増減の定数 */
export const REPUTATION_POINTS = {
  /** 勝利時の獲得ポイント */
  WIN: 50,
  /** 敗北時の獲得ポイント */
  LOSS: 10,
  /** スカウト候補更新のコスト */
  SCOUT_REFRESH_COST: 20,
} as const;

/** 評判ランクの順序（低い→高い） */
export const REPUTATION_RANK_ORDER: ReputationRank[] = ["弱小", "中堅", "強豪", "名門"];

/**
 * 評判ポイントから評判ランクを取得する
 * @param reputation 評判ポイント
 * @returns 評判ランク
 */
export function getReputationRank(reputation: number): ReputationRank {
  if (reputation >= 700) return "名門";
  if (reputation >= 400) return "強豪";
  if (reputation >= 100) return "中堅";
  return "弱小";
}

/**
 * 評判ポイントから部員数上限を取得する
 * @param reputation 評判ポイント
 * @returns 部員数上限（1学年あたり）
 */
export function getMemberLimit(reputation: number): number {
  const rank = getReputationRank(reputation);
  return REPUTATION_THRESHOLDS[rank].memberLimit;
}

/**
 * 評判ランクの星数を取得する（表示用）
 * @param reputation 評判ポイント
 * @returns 星の数（1〜5）
 */
export function getReputationStars(reputation: number): number {
  if (reputation >= 700) return 5;
  if (reputation >= 400) return 4;
  if (reputation >= 100) return 3;
  if (reputation >= 50) return 2;
  return 1;
}

/**
 * 次のランクまでの残りポイントを取得する
 * @param reputation 現在の評判ポイント
 * @returns 次のランクまでのポイント（最高ランクの場合はnull）
 */
export function getPointsToNextRank(reputation: number): number | null {
  if (reputation >= 700) return null; // 最高ランク
  if (reputation >= 400) return 700 - reputation;
  if (reputation >= 100) return 400 - reputation;
  return 100 - reputation;
}
