/**
 * ランク変換
 * 能力値（0-100）をランク（S-G）に変換
 */

import type { Rank } from "@/types/ability";
import { RANK_THRESHOLDS } from "@/types/ability";

/**
 * 能力値をランクに変換
 * @param value 能力値（0-100）
 * @returns ランク（S-G）
 */
export function convertToRank(value: number): Rank {
  // 値を0-100の範囲にクランプ
  const clampedValue = Math.max(0, Math.min(100, value));

  // 閾値に基づいてランクを判定
  for (const threshold of RANK_THRESHOLDS) {
    if (clampedValue >= threshold.min) {
      return threshold.rank;
    }
  }

  // フォールバック（通常は到達しない）
  return "G";
}

/**
 * ランクから色を取得
 * @param rank ランク
 * @returns Tailwind CSSカラークラス
 */
export function getRankColor(rank: Rank): string {
  const colorMap: Record<Rank, string> = {
    SS: "text-purple-600", // レインボー/パープル
    S: "text-yellow-500", // ゴールド
    A: "text-gray-400", // シルバー
    B: "text-orange-600", // ブロンズ
    C: "text-green-600", // グリーン
    D: "text-green-700", // オリーブ
    E: "text-yellow-700", // ブラウン
    F: "text-yellow-600", // ライトブラウン
    G: "text-gray-500", // グレー
  };

  return colorMap[rank];
}

/**
 * ランクから背景色を取得
 * @param rank ランク
 * @returns Tailwind CSS背景カラークラス
 */
export function getRankBgColor(rank: Rank): string {
  const bgColorMap: Record<Rank, string> = {
    SS: "bg-purple-100", // レインボー/パープル
    S: "bg-yellow-100", // ゴールド
    A: "bg-gray-100", // シルバー
    B: "bg-orange-100", // ブロンズ
    C: "bg-green-100", // グリーン
    D: "bg-green-50", // オリーブ
    E: "bg-yellow-50", // ブラウン
    F: "bg-yellow-50", // ライトブラウン
    G: "bg-gray-50", // グレー
  };

  return bgColorMap[rank];
}

/**
 * スコアから星の数を取得
 * @param score スコア（0-100）
 * @returns 星の数（1-5）
 */
export function convertToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}
