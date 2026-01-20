/**
 * ポジション編成バリデーションロジック
 */

import type { Position } from "@/types/position";
import type { TeamMemberWithPokemon } from "@/types/team";
import type { FormationState, FormationValidationResult } from "@/types/formation";
import { ALL_POSITIONS } from "@/types/formation";
import { POSITION_NAMES_JA } from "@/types/position";
import { isEligibleForPosition } from "@/lib/utils/team-builder";

/**
 * 編成をバリデーション
 * @param formation 編成状態
 * @returns バリデーション結果
 */
export function validateFormation(formation: FormationState): FormationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 9ポジションすべて埋まっているかチェック
  const emptyPositions: Position[] = [];
  for (const position of ALL_POSITIONS) {
    if (!formation.starters.get(position)) {
      emptyPositions.push(position);
    }
  }

  if (emptyPositions.length > 0) {
    const positionNames = emptyPositions.map((p) => POSITION_NAMES_JA[p]).join("、");
    errors.push(`以下のポジションが未配置です: ${positionNames}`);
  }

  // 重複チェック（同一メンバーが複数ポジションに配置されていないか）
  const assignedMemberIds = new Set<string>();
  const duplicateMembers: string[] = [];

  for (const [, member] of formation.starters) {
    if (member) {
      if (assignedMemberIds.has(member.id)) {
        duplicateMembers.push(member.pokemon.nameJa || member.pokemon.name);
      }
      assignedMemberIds.add(member.id);
    }
  }

  if (duplicateMembers.length > 0) {
    errors.push(`以下のメンバーが複数ポジションに配置されています: ${duplicateMembers.join("、")}`);
  }

  // 適性外配置の警告
  for (const [position, member] of formation.starters) {
    if (member && !isEligibleForPosition(member.pokemon, position)) {
      const pokemonName = member.pokemon.nameJa || member.pokemon.name;
      const positionName = POSITION_NAMES_JA[position];
      warnings.push(`${pokemonName}は${positionName}の適性がありません`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 編成状態を初期化
 * @param members チームメンバー一覧
 * @returns 編成状態
 */
export function initializeFormation(members: TeamMemberWithPokemon[]): FormationState {
  const starters = new Map<Position, TeamMemberWithPokemon | null>();
  const bench: TeamMemberWithPokemon[] = [];

  // すべてのポジションをnullで初期化
  for (const position of ALL_POSITIONS) {
    starters.set(position, null);
  }

  // 学年順（3年→2年→1年）でソートして、上級生を優先的にスタメンに配置
  const sortedMembers = [...members].sort((a, b) => b.grade - a.grade);

  // メンバーを分類
  for (const member of sortedMembers) {
    const position = member.position as Position;

    // is_starter=trueかつ、そのポジションがまだ空いている場合はスタメンに配置
    if (member.is_starter && ALL_POSITIONS.includes(position) && !starters.get(position)) {
      starters.set(position, member);
    } else {
      // それ以外はベンチへ
      bench.push(member);
    }
  }

  return { starters, bench };
}

/**
 * 編成状態からDB更新用のデータを生成
 * @param formation 編成状態
 * @returns 更新データの配列
 */
export function formationToUpdateData(
  formation: FormationState
): { memberId: string; position: Position; isStarter: boolean }[] {
  const updateData: { memberId: string; position: Position; isStarter: boolean }[] = [];

  // スタメン
  for (const [position, member] of formation.starters) {
    if (member) {
      updateData.push({
        memberId: member.id,
        position,
        isStarter: true,
      });
    }
  }

  // ベンチ
  for (const member of formation.bench) {
    updateData.push({
      memberId: member.id,
      position: member.position as Position,
      isStarter: false,
    });
  }

  return updateData;
}
