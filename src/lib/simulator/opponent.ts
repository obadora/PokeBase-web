/**
 * 対戦相手チーム生成ロジック
 * 自チームの戦力に応じた対戦相手を生成（ポケモンで構成）
 */

import type { Position } from "@/types/position";
import type { OpponentTeam, OpponentMember } from "@/types/match";
import type { Pokemon } from "@/types";

/**
 * 対戦相手チーム名とタイプの対応
 */
export const OPPONENT_TEAMS: { name: string; type: string }[] = [
  { name: "草タイプ高校", type: "grass" },
  { name: "炎タイプ学園", type: "fire" },
  { name: "水タイプ工業", type: "water" },
  { name: "電気タイプ商業", type: "electric" },
  { name: "岩タイプ学院", type: "rock" },
  { name: "地面タイプ農業", type: "ground" },
  { name: "飛行タイプ高校", type: "flying" },
  { name: "格闘タイプ大学附属", type: "fighting" },
  { name: "毒タイプ高校", type: "poison" },
  { name: "虫タイプ農林", type: "bug" },
  { name: "ゴーストタイプ学園", type: "ghost" },
  { name: "鋼タイプ工科", type: "steel" },
  { name: "氷タイプ高校", type: "ice" },
  { name: "ドラゴンタイプ学院", type: "dragon" },
  { name: "悪タイプ商業", type: "dark" },
  { name: "エスパータイプ大学附属", type: "psychic" },
  { name: "フェアリータイプ女学院", type: "fairy" },
  { name: "ノーマルタイプ総合高校", type: "normal" },
];

/**
 * ランダムな整数を生成
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 配列からランダムに要素を取得
 */
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * 配列からランダムにN個の要素を取得（重複なし）
 */
function randomSample<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * 特定のタイプを持つポケモンを取得
 */
function getPokemonByType(allPokemon: Pokemon[], typeName: string): Pokemon[] {
  return allPokemon.filter((p) => p.types.some((t) => t.typeName === typeName));
}

/**
 * 対戦相手チームを生成（ポケモンで構成）
 * @param teamPower 自チームの戦力（これを基準に相手の強さを決定）
 * @param allPokemon 全ポケモンデータ
 * @param difficulty 難易度調整（0.5 = 弱い, 1.0 = 同等, 1.5 = 強い）
 */
export function generateOpponentTeam(
  teamPower: number,
  allPokemon: Pokemon[],
  difficulty: number = 1.0
): OpponentTeam {
  // ランダムにチームを選択
  const team = randomElement(OPPONENT_TEAMS);
  const teamName = team.name;
  const teamType = team.type;

  // 相手チームの戦力を計算（自チーム戦力 × 難易度 × ランダム係数）
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8〜1.2
  const opponentPower = Math.round(teamPower * difficulty * randomFactor);

  // そのタイプのポケモンを取得
  let typePokemon = getPokemonByType(allPokemon, teamType);

  // タイプのポケモンが9匹未満の場合は全ポケモンから補充
  if (typePokemon.length < 9) {
    const otherPokemon = allPokemon.filter((p) => !typePokemon.some((tp) => tp.id === p.id));
    typePokemon = [...typePokemon, ...randomSample(otherPokemon, 9 - typePokemon.length)];
  }

  // 9人のメンバーをランダムに選択
  const selectedPokemon = randomSample(typePokemon, 9);

  // ポジションを割り当て
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

  const members: OpponentMember[] = positions.map((position, index) => {
    const pokemon = selectedPokemon[index];

    // 各メンバーの能力はチーム平均からばらつきを持たせる
    const memberPower = Math.round(
      opponentPower * (0.7 + Math.random() * 0.6) // 70%〜130%のばらつき
    );

    return {
      name: pokemon.nameJa || pokemon.name,
      position,
      power: Math.max(10, Math.min(100, memberPower)), // 10〜100の範囲に収める
      pokemonId: pokemon.id,
      spriteUrl: pokemon.sprites.frontDefault,
    };
  });

  return {
    name: teamName,
    power: opponentPower,
    members,
  };
}

/**
 * 大会ラウンドに応じた難易度を取得
 * @param round 大会のラウンド（1回戦、2回戦...）
 * @param tournamentType 大会タイプ
 */
export function getDifficultyByRound(
  round: number,
  tournamentType: "district" | "regional" | "national"
): number {
  // 大会タイプによる基本難易度
  const baseDifficulty =
    tournamentType === "national" ? 1.2 : tournamentType === "regional" ? 1.0 : 0.8;

  // ラウンドが進むごとに難易度上昇
  const roundBonus = (round - 1) * 0.1;

  return baseDifficulty + roundBonus;
}

/**
 * ランダムマッチ（練習試合）用の対戦相手を生成
 */
export function generateRandomOpponent(teamPower: number, allPokemon: Pokemon[]): OpponentTeam {
  // 練習試合は難易度にばらつきを持たせる
  const difficulty = 0.6 + Math.random() * 0.8; // 0.6〜1.4
  return generateOpponentTeam(teamPower, allPokemon, difficulty);
}
