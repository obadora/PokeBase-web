/**
 * ポジション適性評価
 * 野手能力からポジション適性を計算
 */

import type { Position, PositionFitness } from "@/types/position";
import type { FielderAbility, PitcherAbility } from "@/types/ability";
import { POSITION_WEIGHTS } from "@/lib/constants/weights";

/**
 * ポジション適性スコアを計算
 * @param ability 野手能力または投手能力
 * @param position ポジション
 * @returns 適性スコア（0-100）
 */
export function calculatePositionScore(
  ability: FielderAbility | PitcherAbility,
  position: Position
): number {
  const weights = POSITION_WEIGHTS[position];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const value = ability[key as keyof typeof ability];
    if (typeof value === "number" && typeof weight === "number") {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  // 重み付き平均を計算
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // スコアを1.5倍にブースト（より高いスコアを得やすくする）
  // ただし100を超えないようにキャップ
  const boostedScore = Math.min(rawScore * 1.5, 100);

  return Math.round(boostedScore);
}

/**
 * 全ポジションの適性を評価
 * @param fielderAbility 野手能力
 * @param pitcherAbility 投手能力
 * @returns ポジション適性リスト（スコア降順）
 */
export function evaluatePositions(
  fielderAbility: FielderAbility,
  pitcherAbility: PitcherAbility
): PositionFitness[] {
  const positions: Position[] = [
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

  const fitness: PositionFitness[] = positions.map((position) => {
    const ability = position === "pitcher" ? pitcherAbility : fielderAbility;
    const score = calculatePositionScore(ability, position);

    return {
      position,
      score,
      stars: 0, // 後で設定
      rank: 0, // 後で設定
    };
  });

  // スコア降順でソート
  fitness.sort((a, b) => b.score - a.score);

  // 順位を設定し、スコアの絶対値に基づいて星を設定
  fitness.forEach((item, index) => {
    item.rank = index + 1;

    // スコアの絶対値に基づいて星を設定
    if (item.score >= 80) {
      item.stars = 5; // ⭐⭐⭐⭐⭐: 80点以上
    } else if (item.score >= 60) {
      item.stars = 4; // ⭐⭐⭐⭐: 60-79点
    } else if (item.score >= 40) {
      item.stars = 3; // ⭐⭐⭐: 40-59点
    } else if (item.score >= 20) {
      item.stars = 2; // ⭐⭐: 20-39点
    } else {
      item.stars = 1; // ⭐: 0-19点
    }
  });

  return fitness;
}

/**
 * トップ3のポジションを取得
 * @param fielderAbility 野手能力
 * @param pitcherAbility 投手能力
 * @returns トップ3のポジション適性
 */
export function getTopPositions(
  fielderAbility: FielderAbility,
  pitcherAbility: PitcherAbility
): PositionFitness[] {
  const allPositions = evaluatePositions(fielderAbility, pitcherAbility);
  return allPositions.slice(0, 3);
}
