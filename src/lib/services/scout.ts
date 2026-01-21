/**
 * スカウト機能のサービス
 * - ランダムなスカウト候補の生成
 * - 候補のポジション適性評価
 */

import type { Pokemon } from "@/types/index";
import type { Position, PositionFitness } from "@/types/position";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { evaluatePositions } from "@/lib/evaluator/position";

/** スカウト候補 */
export interface ScoutCandidate {
  pokemon: Pokemon;
  bestPosition: Position;
  positionFitness: PositionFitness;
  allPositions: PositionFitness[];
}

/** スカウト候補生成オプション */
export interface ScoutOptions {
  /** 生成する候補数 */
  count?: number;
  /** 除外するポケモンID（既存メンバー） */
  excludeIds?: number[];
}

/**
 * ランダムにスカウト候補を生成する
 * @param allPokemon 全ポケモンリスト
 * @param options オプション
 * @returns スカウト候補リスト
 */
export function generateScoutCandidates(
  allPokemon: Pokemon[],
  options: ScoutOptions = {}
): ScoutCandidate[] {
  const { count = 3, excludeIds = [] } = options;

  // 除外IDを除いたポケモンリストを作成
  const availablePokemon = allPokemon.filter((p) => !excludeIds.includes(p.id));

  if (availablePokemon.length === 0) {
    return [];
  }

  // ランダムに候補を選出
  const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, availablePokemon.length));

  // 各候補のポジション適性を評価
  return selected.map((pokemon) => evaluateCandidatePositions(pokemon));
}

/**
 * 候補のポジション適性を評価する
 * @param pokemon ポケモン
 * @returns スカウト候補（適性付き）
 */
export function evaluateCandidatePositions(pokemon: Pokemon): ScoutCandidate {
  const pitcherAbility = calculatePitcherAbility(pokemon.stats);
  const fielderAbility = calculateFielderAbility(pokemon.stats);
  const allPositions = evaluatePositions(fielderAbility, pitcherAbility);

  // 最も適性の高いポジション
  const bestPositionFitness = allPositions[0];

  return {
    pokemon,
    bestPosition: bestPositionFitness.position,
    positionFitness: bestPositionFitness,
    allPositions,
  };
}

/**
 * 特定ポジションに適性のある候補を生成する
 * @param allPokemon 全ポケモンリスト
 * @param targetPosition 狙うポジション
 * @param options オプション
 * @returns スカウト候補リスト（指定ポジション適性順）
 */
export function generatePositionTargetedCandidates(
  allPokemon: Pokemon[],
  targetPosition: Position,
  options: ScoutOptions = {}
): ScoutCandidate[] {
  const { count = 3, excludeIds = [] } = options;

  // 除外IDを除いたポケモンリストを作成
  const availablePokemon = allPokemon.filter((p) => !excludeIds.includes(p.id));

  if (availablePokemon.length === 0) {
    return [];
  }

  // 全員の適性を評価
  const candidates = availablePokemon.map((pokemon) => evaluateCandidatePositions(pokemon));

  // 指定ポジションの適性スコアでソート
  candidates.sort((a, b) => {
    const aScore = a.allPositions.find((p) => p.position === targetPosition)?.score ?? 0;
    const bScore = b.allPositions.find((p) => p.position === targetPosition)?.score ?? 0;
    return bScore - aScore;
  });

  // ランダム性を加えるため、上位から一定範囲で選出
  const topRange = Math.min(candidates.length, count * 3);
  const topCandidates = candidates.slice(0, topRange);
  const shuffled = topCandidates.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}
