/**
 * チーム構築ユーティリティ
 * ポジション適性に基づくポケモン選択・ランダム生成
 */

import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import type { MemberSlotState } from "@/types/team";
import { POSITION_CATEGORIES } from "@/types/team";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
import { evaluatePositions } from "@/lib/evaluator/position";

/** 適性トップN以内のポジションを取得 */
const TOP_N_POSITIONS = 3;

/**
 * ポケモンの適性ポジション（上位3つ）を取得
 * @param pokemon ポケモン
 * @returns 適性ポジションの配列
 */
export function getEligiblePositions(pokemon: Pokemon): Position[] {
  const stats = {
    hp: pokemon.stats.hp,
    attack: pokemon.stats.attack,
    defense: pokemon.stats.defense,
    specialAttack: pokemon.stats.specialAttack,
    specialDefense: pokemon.stats.specialDefense,
    speed: pokemon.stats.speed,
  };

  const fielderAbility = calculateFielderAbility(stats);
  const pitcherAbility = calculatePitcherAbility(stats);
  const fitness = evaluatePositions(fielderAbility, pitcherAbility);

  // 上位3ポジションを返す
  return fitness.slice(0, TOP_N_POSITIONS).map((f) => f.position);
}

/**
 * 指定ポジションに適性があるかチェック
 * @param pokemon ポケモン
 * @param position ポジション
 * @returns 適性があればtrue
 */
export function isEligibleForPosition(pokemon: Pokemon, position: Position): boolean {
  const eligiblePositions = getEligiblePositions(pokemon);
  return eligiblePositions.includes(position);
}

/**
 * 指定ポジションに適性があるポケモンをフィルタリング
 * @param pokemonList ポケモン一覧
 * @param position ポジション
 * @param excludeIds 除外するポケモンID
 * @returns 適性があるポケモン一覧
 */
export function filterPokemonByPosition(
  pokemonList: Pokemon[],
  position: Position,
  excludeIds: number[] = []
): Pokemon[] {
  return pokemonList.filter(
    (p) => !excludeIds.includes(p.id) && isEligibleForPosition(p, position)
  );
}

/**
 * 指定ポジションに適性があるポケモンをランダムに1匹選択
 * @param pokemonList ポケモン一覧
 * @param position ポジション
 * @param excludeIds 除外するポケモンID
 * @returns ランダムに選ばれたポケモン（見つからない場合はnull）
 */
export function getRandomPokemonForPosition(
  pokemonList: Pokemon[],
  position: Position,
  excludeIds: number[] = []
): Pokemon | null {
  const eligible = filterPokemonByPosition(pokemonList, position, excludeIds);
  if (eligible.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}

/** 学年の構成定義 */
export interface GradeComposition {
  pitcher: number;
  catcher: number;
  infield: number; // 一塁、二塁、三塁、遊撃から選択
  outfield: number; // 左翼、中堅、右翼から選択
}

/** デフォルトの学年構成（6人） */
export const DEFAULT_GRADE_COMPOSITION: GradeComposition = {
  pitcher: 1,
  catcher: 1,
  infield: 2, // 2-3人だが、デフォルトは2
  outfield: 2, // 1-2人だが、デフォルトは2
};

/**
 * 1学年分のメンバーをランダム生成
 * @param pokemonList ポケモン一覧
 * @param excludeIds 除外するポケモンID
 * @param composition 構成（デフォルト: 投手1、捕手1、内野2、外野2）
 * @returns メンバー状態の配列
 */
export function generateRandomGradeMembers(
  pokemonList: Pokemon[],
  excludeIds: number[] = [],
  composition: GradeComposition = DEFAULT_GRADE_COMPOSITION
): MemberSlotState[] {
  const members: MemberSlotState[] = [];
  const usedIds = [...excludeIds];

  // 投手
  for (let i = 0; i < composition.pitcher; i++) {
    const pokemon = getRandomPokemonForPosition(pokemonList, "pitcher", usedIds);
    if (pokemon) {
      members.push({ position: "pitcher", pokemon, isRequired: true });
      usedIds.push(pokemon.id);
    }
  }

  // 捕手
  for (let i = 0; i < composition.catcher; i++) {
    const pokemon = getRandomPokemonForPosition(pokemonList, "catcher", usedIds);
    if (pokemon) {
      members.push({ position: "catcher", pokemon, isRequired: true });
      usedIds.push(pokemon.id);
    }
  }

  // 内野手（一塁、二塁、三塁、遊撃からランダムに選択）
  const infieldPositions = [...POSITION_CATEGORIES.infield];
  shuffleArray(infieldPositions);
  for (let i = 0; i < composition.infield && i < infieldPositions.length; i++) {
    const position = infieldPositions[i];
    const pokemon = getRandomPokemonForPosition(pokemonList, position, usedIds);
    if (pokemon) {
      members.push({ position, pokemon, isRequired: false });
      usedIds.push(pokemon.id);
    }
  }

  // 外野手（左翼、中堅、右翼からランダムに選択）
  const outfieldPositions = [...POSITION_CATEGORIES.outfield];
  shuffleArray(outfieldPositions);
  for (let i = 0; i < composition.outfield && i < outfieldPositions.length; i++) {
    const position = outfieldPositions[i];
    const pokemon = getRandomPokemonForPosition(pokemonList, position, usedIds);
    if (pokemon) {
      members.push({ position, pokemon, isRequired: false });
      usedIds.push(pokemon.id);
    }
  }

  return members;
}

/**
 * 配列をシャッフル（Fisher-Yatesアルゴリズム）
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 1年生用の初期メンバー状態を生成（空スロット）
 * @returns メンバー状態の配列
 */
export function createEmptyFirstYearSlots(): MemberSlotState[] {
  const members: MemberSlotState[] = [];

  // 投手（必須）
  members.push({ position: "pitcher", pokemon: null, isRequired: true });

  // 捕手（必須）
  members.push({ position: "catcher", pokemon: null, isRequired: true });

  // 内野手（2スロット、デフォルトで一塁と二塁）
  members.push({ position: "first", pokemon: null, isRequired: false });
  members.push({ position: "second", pokemon: null, isRequired: false });

  // 外野手（2スロット、デフォルトで左翼と中堅）
  members.push({ position: "left", pokemon: null, isRequired: false });
  members.push({ position: "center", pokemon: null, isRequired: false });

  return members;
}

/**
 * 1年生メンバーを一括ランダム生成
 * @param pokemonList ポケモン一覧
 * @param excludeIds 除外するポケモンID（2・3年生で使用済み）
 * @returns メンバー状態の配列
 */
export function generateRandomFirstYearMembers(
  pokemonList: Pokemon[],
  excludeIds: number[] = []
): MemberSlotState[] {
  return generateRandomGradeMembers(pokemonList, excludeIds, DEFAULT_GRADE_COMPOSITION);
}

/**
 * チーム全体（18人）を生成
 * 2・3年生はランダム、1年生は空スロット
 * @param pokemonList ポケモン一覧
 * @returns { firstYear, secondYear, thirdYear }
 */
export function initializeTeamMembers(pokemonList: Pokemon[]): {
  firstYear: MemberSlotState[];
  secondYear: MemberSlotState[];
  thirdYear: MemberSlotState[];
} {
  const usedIds: number[] = [];

  // 3年生を先に生成
  const thirdYear = generateRandomGradeMembers(pokemonList, usedIds);
  thirdYear.forEach((m) => {
    if (m.pokemon) usedIds.push(m.pokemon.id);
  });

  // 2年生を生成
  const secondYear = generateRandomGradeMembers(pokemonList, usedIds);
  secondYear.forEach((m) => {
    if (m.pokemon) usedIds.push(m.pokemon.id);
  });

  // 1年生は空スロット
  const firstYear = createEmptyFirstYearSlots();

  return { firstYear, secondYear, thirdYear };
}

/**
 * 使用済みポケモンIDを取得
 */
export function getUsedPokemonIds(members: MemberSlotState[]): number[] {
  return members.filter((m) => m.pokemon).map((m) => m.pokemon!.id);
}
