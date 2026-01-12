/**
 * ポジション別重み定義
 * 各ポジションにおける能力値の重要度を定義
 */

import type { Position } from "@/types/position";
import type { FielderAbility, PitcherAbility } from "@/types/ability";

/** 野手ポジションの重み型 */
export type FielderWeights = {
  [K in keyof FielderAbility]?: number;
};

/** 投手ポジションの重み型 */
export type PitcherWeights = {
  [K in keyof PitcherAbility]?: number;
};

/** ポジション別重み定義 */
export const POSITION_WEIGHTS: Record<Position, FielderWeights | PitcherWeights> = {
  // 投手: スタミナ0.3, 制球力0.3, 球速0.2, 変化球0.2
  pitcher: {
    stamina: 0.3,
    control: 0.3,
    velocity: 0.2,
    breaking: 0.2,
  } as PitcherWeights,

  // 捕手: 守備力0.35, 肩力0.35, スタミナ0.2, パワー0.1
  catcher: {
    defense: 0.35,
    arm: 0.35,
    stamina: 0.2,
    power: 0.1,
  } as FielderWeights,

  // 一塁手: パワー0.4, ミート0.4, 守備力0.2
  first: {
    power: 0.4,
    meet: 0.4,
    defense: 0.2,
  } as FielderWeights,

  // 二塁手: 走力0.35, 守備力0.35, 肩力0.2, ミート0.1
  second: {
    speed: 0.35,
    defense: 0.35,
    arm: 0.2,
    meet: 0.1,
  } as FielderWeights,

  // 三塁手: パワー0.35, 肩力0.3, ミート0.25, 守備0.1
  third: {
    power: 0.35,
    arm: 0.3,
    meet: 0.25,
    defense: 0.1,
  } as FielderWeights,

  // 遊撃手: 走力0.35, 守備力0.35, 肩力0.25, ミート0.05
  short: {
    speed: 0.35,
    defense: 0.35,
    arm: 0.25,
    meet: 0.05,
  } as FielderWeights,

  // 左翼手: パワー0.4, ミート0.3, 走力0.2, 守備0.1
  left: {
    power: 0.4,
    meet: 0.3,
    speed: 0.2,
    defense: 0.1,
  } as FielderWeights,

  // 中堅手: 走力0.3, 肩力0.25, 守備0.25, ミート0.2
  center: {
    speed: 0.3,
    arm: 0.25,
    defense: 0.25,
    meet: 0.2,
  } as FielderWeights,

  // 右翼手: 肩力0.3, 走力0.2, 守備0.2, ミート0.2, パワー0.1
  right: {
    arm: 0.3,
    speed: 0.2,
    defense: 0.2,
    meet: 0.2,
    power: 0.1,
  } as FielderWeights,
} as const;
