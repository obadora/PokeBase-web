/**
 * 対戦相手生成サービス
 * - タイプ統一チーム生成（地区予選・地方大会）
 * - バランス型強豪チーム生成（全国大会）
 */

import type { Pokemon } from "@/types/index";
import type { Position } from "@/types/position";
import type {
  TournamentType,
  OpponentTeam,
  OpponentMember,
  TournamentConfig,
} from "@/types/opponent";
import {
  TOURNAMENT_CONFIGS,
  TEAM_NAME_PREFIXES,
  TEAM_NAME_SUFFIXES,
  POKEMON_TYPES,
} from "@/types/opponent";
import { evaluateCandidatePositions } from "@/lib/services/scout";

/**
 * ポケモンの平均種族値を計算
 * @param pokemon ポケモン
 * @returns 平均種族値
 */
export function calculateAverageStats(pokemon: Pokemon): number {
  const { hp, attack, defense, specialAttack, specialDefense, speed } = pokemon.stats;
  return Math.round((hp + attack + defense + specialAttack + specialDefense + speed) / 6);
}

/**
 * チーム名をランダム生成
 * @param usedNames 使用済みのチーム名（重複防止用）
 * @returns チーム名
 */
export function generateTeamName(usedNames: Set<string> = new Set()): string {
  let name: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const prefix = TEAM_NAME_PREFIXES[Math.floor(Math.random() * TEAM_NAME_PREFIXES.length)];
    const suffix = TEAM_NAME_SUFFIXES[Math.floor(Math.random() * TEAM_NAME_SUFFIXES.length)];
    name = `${prefix}${suffix}`;
    attempts++;
  } while (usedNames.has(name) && attempts < maxAttempts);

  return name;
}

/**
 * タイプでポケモンをフィルタリング
 * @param allPokemon 全ポケモンリスト
 * @param typeName タイプ名（英語）
 * @returns フィルタリングされたポケモンリスト
 */
export function filterByType(allPokemon: Pokemon[], typeName: string): Pokemon[] {
  return allPokemon.filter((p) => p.types.some((t) => t.typeName === typeName));
}

/**
 * 能力値範囲でポケモンをフィルタリング
 * @param pokemon ポケモンリスト
 * @param minAvg 最小平均値
 * @param maxAvg 最大平均値
 * @returns フィルタリングされたポケモンリスト
 */
export function filterByStatsRange(
  pokemon: Pokemon[],
  minAvg: number,
  maxAvg: number
): Pokemon[] {
  return pokemon.filter((p) => {
    const avg = calculateAverageStats(p);
    return avg >= minAvg && avg <= maxAvg;
  });
}

/**
 * ポケモンリストからランダムに選出
 * @param pokemon ポケモンリスト
 * @param count 選出数
 * @returns 選出されたポケモンリスト
 */
export function selectRandom(pokemon: Pokemon[], count: number): Pokemon[] {
  if (pokemon.length <= count) {
    return [...pokemon];
  }
  const shuffled = [...pokemon].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * バランスの良いチームを選出（各タイプからバランスよく選ぶ）
 * @param pokemon ポケモンリスト
 * @param count 選出数
 * @returns 選出されたポケモンリスト
 */
export function selectBalanced(pokemon: Pokemon[], count: number): Pokemon[] {
  if (pokemon.length <= count) {
    return [...pokemon];
  }

  const selected: Pokemon[] = [];
  const usedTypes = new Set<string>();

  // まず各タイプから1匹ずつ選ぶ
  const shuffledPokemon = [...pokemon].sort(() => Math.random() - 0.5);

  for (const p of shuffledPokemon) {
    if (selected.length >= count) break;

    const primaryType = p.types[0]?.typeName;
    if (primaryType && !usedTypes.has(primaryType)) {
      selected.push(p);
      usedTypes.add(primaryType);
    }
  }

  // 足りない分はランダムに追加
  if (selected.length < count) {
    const remaining = shuffledPokemon.filter((p) => !selected.includes(p));
    const additionalCount = count - selected.length;
    selected.push(...remaining.slice(0, additionalCount));
  }

  return selected;
}

/**
 * 9人のチームメンバーを生成
 * @param selectedPokemon 選出されたポケモン（9匹）
 * @returns チームメンバーリスト
 */
export function assignPositions(selectedPokemon: Pokemon[]): OpponentMember[] {
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

  // 各ポケモンのポジション適性を評価
  const evaluatedPokemon = selectedPokemon.map((pokemon) => {
    const evaluated = evaluateCandidatePositions(pokemon);
    return {
      pokemon,
      bestPosition: evaluated.bestPosition,
      positionFitness: evaluated.positionFitness,
      allPositions: evaluated.allPositions,
    };
  });

  const assignedMembers: OpponentMember[] = [];
  const usedPokemon = new Set<number>();
  const usedPositions = new Set<Position>();

  // 各ポジションに最も適性の高いポケモンを割り当て
  for (const position of positions) {
    // まだ割り当てられていないポケモンの中で、このポジションに最も適性の高いものを選ぶ
    const availablePokemon = evaluatedPokemon.filter((ep) => !usedPokemon.has(ep.pokemon.id));

    if (availablePokemon.length === 0) continue;

    // ポジションのスコアでソート
    availablePokemon.sort((a, b) => {
      const aScore = a.allPositions.find((p) => p.position === position)?.score ?? 0;
      const bScore = b.allPositions.find((p) => p.position === position)?.score ?? 0;
      return bScore - aScore;
    });

    const bestMatch = availablePokemon[0];
    usedPokemon.add(bestMatch.pokemon.id);
    usedPositions.add(position);

    assignedMembers.push({
      pokemon: bestMatch.pokemon,
      position,
      battingOrder: assignedMembers.length + 1,
    });
  }

  return assignedMembers;
}

/**
 * 地区予選用のタイプ統一チームを生成
 * @param allPokemon 全ポケモンリスト
 * @param type タイプ名
 * @param seed シード番号
 * @param usedNames 使用済みチーム名
 * @returns 対戦相手チーム
 */
export function generateDistrictTeam(
  allPokemon: Pokemon[],
  type: string,
  seed: number,
  usedNames: Set<string>
): OpponentTeam {
  const config = TOURNAMENT_CONFIGS.district;

  // タイプでフィルタリング
  const candidates = filterByType(allPokemon, type);

  // 能力値でフィルタリング（範囲を広げて最低9匹確保）
  let filtered = filterByStatsRange(candidates, config.minAverageStats, config.maxAverageStats);

  // 候補が9匹未満の場合は範囲を広げる
  if (filtered.length < 9) {
    filtered = filterByStatsRange(candidates, config.minAverageStats - 20, config.maxAverageStats + 20);
  }

  // それでも足りない場合はタイプフィルタのみ
  if (filtered.length < 9) {
    filtered = candidates;
  }

  // 9匹選出
  const selected = selectRandom(filtered, 9);
  const members = assignPositions(selected);

  // チーム平均能力値を計算
  const averageStats = Math.round(
    members.reduce((sum, m) => sum + calculateAverageStats(m.pokemon), 0) / members.length
  );

  const teamName = generateTeamName(usedNames);
  usedNames.add(teamName);

  return {
    id: `district-${seed}-${Date.now()}`,
    name: teamName,
    type,
    members,
    averageStats,
    seed,
  };
}

/**
 * 地方大会用の強化タイプ統一チームを生成
 * @param allPokemon 全ポケモンリスト
 * @param type タイプ名
 * @param seed シード番号
 * @param usedNames 使用済みチーム名
 * @returns 対戦相手チーム
 */
export function generateRegionalTeam(
  allPokemon: Pokemon[],
  type: string,
  seed: number,
  usedNames: Set<string>
): OpponentTeam {
  const config = TOURNAMENT_CONFIGS.regional;

  // タイプでフィルタリング
  const candidates = filterByType(allPokemon, type);

  // 能力値でフィルタリング
  let filtered = filterByStatsRange(candidates, config.minAverageStats, config.maxAverageStats);

  // 候補が9匹未満の場合は範囲を広げる
  if (filtered.length < 9) {
    filtered = filterByStatsRange(candidates, config.minAverageStats - 15, config.maxAverageStats + 15);
  }

  if (filtered.length < 9) {
    filtered = candidates;
  }

  const selected = selectRandom(filtered, 9);
  const members = assignPositions(selected);

  const averageStats = Math.round(
    members.reduce((sum, m) => sum + calculateAverageStats(m.pokemon), 0) / members.length
  );

  const teamName = generateTeamName(usedNames);
  usedNames.add(teamName);

  return {
    id: `regional-${seed}-${Date.now()}`,
    name: teamName,
    type,
    members,
    averageStats,
    seed,
  };
}

/**
 * 全国大会用のバランス型強豪チームを生成
 * @param allPokemon 全ポケモンリスト
 * @param seed シード番号
 * @param usedNames 使用済みチーム名
 * @returns 対戦相手チーム
 */
export function generateNationalTeam(
  allPokemon: Pokemon[],
  seed: number,
  usedNames: Set<string>
): OpponentTeam {
  const config = TOURNAMENT_CONFIGS.national;

  // 能力値でフィルタリング
  let filtered = filterByStatsRange(allPokemon, config.minAverageStats, config.maxAverageStats);

  // 候補が9匹未満の場合は範囲を広げる
  if (filtered.length < 9) {
    filtered = filterByStatsRange(allPokemon, config.minAverageStats - 15, 150);
  }

  const selected = selectBalanced(filtered, 9);
  const members = assignPositions(selected);

  const averageStats = Math.round(
    members.reduce((sum, m) => sum + calculateAverageStats(m.pokemon), 0) / members.length
  );

  const teamName = generateTeamName(usedNames);
  usedNames.add(teamName);

  return {
    id: `national-${seed}-${Date.now()}`,
    name: teamName,
    type: null,
    members,
    averageStats,
    seed,
  };
}

/**
 * 大会種別に応じた対戦相手チームを生成
 * @param allPokemon 全ポケモンリスト
 * @param tournamentType 大会種別
 * @returns 対戦相手チームリスト
 */
export function generateOpponentTeams(
  allPokemon: Pokemon[],
  tournamentType: TournamentType
): OpponentTeam[] {
  const config: TournamentConfig = TOURNAMENT_CONFIGS[tournamentType];
  const teams: OpponentTeam[] = [];
  const usedNames = new Set<string>();
  const usedTypes = new Set<string>();

  // プレイヤーチーム分を除いたチーム数
  const opponentCount = config.teamCount - 1;

  // 使用するタイプをシャッフル
  const shuffledTypes = [...POKEMON_TYPES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < opponentCount; i++) {
    const seed = i + 2; // シード1はプレイヤーチーム

    let team: OpponentTeam;

    if (tournamentType === "district") {
      // 地区予選: タイプ統一
      const type = shuffledTypes[i % shuffledTypes.length];
      usedTypes.add(type);
      team = generateDistrictTeam(allPokemon, type, seed, usedNames);
    } else if (tournamentType === "regional") {
      // 地方大会: 強化タイプ統一
      const type = shuffledTypes[i % shuffledTypes.length];
      usedTypes.add(type);
      team = generateRegionalTeam(allPokemon, type, seed, usedNames);
    } else {
      // 全国大会: バランス型
      team = generateNationalTeam(allPokemon, seed, usedNames);
    }

    teams.push(team);
  }

  return teams;
}
