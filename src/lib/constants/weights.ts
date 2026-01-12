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
  // 投手: スタミナ、制球力、球速、変化球の順
  pitcher: {
    stamina: 0.3,
    control: 0.3,
    velocity: 0.3,
    breaking: 0.1,
  } as PitcherWeights,

  // 捕手: 守備力、肩力、スタミナ、パワーの順
  catcher: {
    defense: 0.35,
    arm: 0.35,
    stamina: 0.2,
    power: 0.1,
  } as FielderWeights,

  // 一塁手: パワー、ミート、守備力の順
  first: {
    power: 0.4,
    meet: 0.4,
    defense: 0.2,
  } as FielderWeights,

  // 二塁手: 走力、守備力、肩力、ミートの順
  second: {
    speed: 0.35,
    defense: 0.35,
    arm: 0.2,
    meet: 0.1,
  } as FielderWeights,

  // 三塁手: 守備力、肩力、パワー、ミートの順
  third: {
    defense: 0.35,
    arm: 0.3,
    power: 0.25,
    meet: 0.1,
  } as FielderWeights,

  // 遊撃手: 走力、守備力、肩力、ミートの順
  short: {
    speed: 0.35,
    defense: 0.35,
    arm: 0.25,
    meet: 0.05,
  } as FielderWeights,

  // 外野手: 走力、肩力、パワー、ミートの順
  outfield: {
    speed: 0.45,
    arm: 0.3,
    power: 0.15,
    meet: 0.1,
  } as FielderWeights,
} as const;
