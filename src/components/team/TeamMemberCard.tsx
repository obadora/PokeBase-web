/**
 * チームメンバーカードコンポーネント
 * メンバーのポケモンと能力値を表示
 */

"use client";

import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";
import { AbilityBars } from "@/components/ui/AbilityBars";
import { calculatePitcherAbility, PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";
import { calculateFielderAbility, FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";

interface TeamMemberCardProps {
  position: Position;
  pokemon: Pokemon;
}

export function TeamMemberCard({ position, pokemon }: TeamMemberCardProps) {
  const positionName = POSITION_NAMES_JA[position];
  const isPitcher = position === "pitcher";

  // 能力値を計算（型変換: PokemonStats -> Stats）
  const stats = {
    hp: pokemon.stats.hp,
    attack: pokemon.stats.attack,
    defense: pokemon.stats.defense,
    specialAttack: pokemon.stats.specialAttack,
    specialDefense: pokemon.stats.specialDefense,
    speed: pokemon.stats.speed,
  };

  // ポジションに応じた能力値を表示
  const abilities = isPitcher
    ? (() => {
        const pitcherAbility = calculatePitcherAbility(stats);
        return [
          { name: PITCHER_ABILITY_NAMES_JA.velocity, value: pitcherAbility.velocity },
          { name: PITCHER_ABILITY_NAMES_JA.control, value: pitcherAbility.control },
          { name: PITCHER_ABILITY_NAMES_JA.stamina, value: pitcherAbility.stamina },
          { name: PITCHER_ABILITY_NAMES_JA.breaking, value: pitcherAbility.breaking },
        ];
      })()
    : (() => {
        const fielderAbility = calculateFielderAbility(stats);
        return [
          { name: FIELDER_ABILITY_NAMES_JA.meet, value: fielderAbility.meet },
          { name: FIELDER_ABILITY_NAMES_JA.power, value: fielderAbility.power },
          { name: FIELDER_ABILITY_NAMES_JA.speed, value: fielderAbility.speed },
          { name: FIELDER_ABILITY_NAMES_JA.arm, value: fielderAbility.arm },
          { name: FIELDER_ABILITY_NAMES_JA.defense, value: fielderAbility.defense },
          { name: FIELDER_ABILITY_NAMES_JA.stamina, value: fielderAbility.stamina },
        ];
      })();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* ポジションバッジ */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
          {positionName}
        </span>
      </div>

      {/* ポケモン情報 */}
      <div className="flex items-start gap-4">
        {/* ポケモン画像 */}
        <div className="flex-shrink-0">
          {pokemon.sprites.frontDefault ? (
            <Image
              src={pokemon.sprites.frontDefault}
              alt={pokemon.nameJa || pokemon.name}
              width={80}
              height={80}
              className="w-20 h-20"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400">?</span>
            </div>
          )}
        </div>

        {/* ポケモン名と番号 */}
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-800">
            #{pokemon.id.toString().padStart(3, "0")} {pokemon.nameJa || pokemon.name}
          </p>
          {pokemon.nameJa && <p className="text-sm text-gray-500">{pokemon.name}</p>}
        </div>
      </div>

      {/* 能力値バー */}
      <div className="mt-4">
        <AbilityBars abilities={abilities} />
      </div>
    </div>
  );
}
