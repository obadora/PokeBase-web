/**
 * 投手能力計算
 * ポケモンの種族値から投手としての能力値を計算
 */

import type { Stats } from "@/types/pokemon";
import type { PitcherAbility } from "@/types/ability";

/**
 * 投手能力を計算
 * @param stats ポケモンの種族値
 * @returns 投手能力（0-100のスケール）
 */
export function calculatePitcherAbility(stats: Stats): PitcherAbility {
  return {
    // 球速: (素早さ + 攻撃力) / 2 を255で正規化
    velocity: Math.round(((stats.speed + stats.attack) / 2 / 255) * 100),

    // 制球力: (防御力 + 特防) / 2 を255で正規化
    control: Math.round(((stats.defense + stats.specialDefense) / 2 / 255) * 100),

    // スタミナ: HPを255で正規化
    stamina: Math.round((stats.hp / 255) * 100),

    // 変化球: 特攻を255で正規化
    breaking: Math.round((stats.specialAttack / 255) * 100),
  };
}

/**
 * 投手能力の各項目名を日本語で取得
 */
export const PITCHER_ABILITY_NAMES_JA: Record<keyof PitcherAbility, string> = {
  velocity: "球速",
  control: "制球力",
  stamina: "スタミナ",
  breaking: "変化球",
};

/**
 * 投手能力の各項目名を英語で取得
 */
export const PITCHER_ABILITY_NAMES_EN: Record<keyof PitcherAbility, string> = {
  velocity: "Velocity",
  control: "Control",
  stamina: "Stamina",
  breaking: "Breaking",
};
