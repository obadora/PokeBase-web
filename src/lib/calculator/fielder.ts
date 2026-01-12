/**
 * 野手能力計算
 * ポケモンの種族値から野手としての能力値を計算
 */

import type { Stats } from "@/types/pokemon";
import type { FielderAbility } from "@/types/ability";

/**
 * 野手能力を計算
 * @param stats ポケモンの種族値
 * @returns 野手能力（0-100のスケール）
 */
export function calculateFielderAbility(stats: Stats): FielderAbility {
  return {
    // ミート(打率): 特攻を255で正規化
    meet: Math.round((stats.specialAttack / 255) * 100),

    // パワー(長打力): 攻撃力を255で正規化
    power: Math.round((stats.attack / 255) * 100),

    // 走力: 素早さを255で正規化
    speed: Math.round((stats.speed / 255) * 100),

    // 肩力: 特防を255で正規化
    arm: Math.round((stats.specialDefense / 255) * 100),

    // 守備力: 防御力を255で正規化
    defense: Math.round((stats.defense / 255) * 100),

    // スタミナ: HPを255で正規化
    stamina: Math.round((stats.hp / 255) * 100),
  };
}

/**
 * 野手能力の各項目名を日本語で取得
 */
export const FIELDER_ABILITY_NAMES_JA: Record<keyof FielderAbility, string> = {
  meet: "ミート",
  power: "パワー",
  speed: "走力",
  arm: "肩力",
  defense: "守備力",
  stamina: "スタミナ",
};

/**
 * 野手能力の各項目名を英語で取得
 */
export const FIELDER_ABILITY_NAMES_EN: Record<keyof FielderAbility, string> = {
  meet: "Contact",
  power: "Power",
  speed: "Speed",
  arm: "Arm",
  defense: "Defense",
  stamina: "Stamina",
};
