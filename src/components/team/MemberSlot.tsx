/**
 * メンバースロットコンポーネント
 * 個別のポジションスロットにポケモンを表示
 */

"use client";

import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";

interface MemberSlotProps {
  position: Position;
  pokemon: Pokemon | null;
  isRequired: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function MemberSlot({
  position,
  pokemon,
  isRequired,
  isSelected,
  onClick,
}: MemberSlotProps) {
  const positionName = POSITION_NAMES_JA[position];
  const hasError = isRequired && !pokemon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-24 h-28 p-2 rounded-lg border-2 transition-all
        ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
        ${hasError ? "border-red-400 bg-red-50" : ""}
        ${pokemon ? "bg-green-50 border-green-400" : ""}
      `}
    >
      {/* 必須マーク */}
      {isRequired && (
        <span className="absolute top-1 right-1 text-red-500 text-xs font-bold">*</span>
      )}

      {/* ポジション名 */}
      <span className="text-xs font-semibold text-gray-600 mb-1">{positionName}</span>

      {/* ポケモン画像または空きスロット */}
      {pokemon ? (
        <>
          <div className="w-12 h-12 relative">
            {pokemon.sprites.frontDefault && (
              <Image
                src={pokemon.sprites.frontDefault}
                alt={pokemon.nameJa || pokemon.name}
                fill
                sizes="48px"
                className="object-contain"
              />
            )}
          </div>
          <span className="text-xs text-gray-700 truncate max-w-full">
            {pokemon.nameJa || pokemon.name}
          </span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
            <span className="text-2xl text-gray-400">+</span>
          </div>
          <span className="text-xs text-gray-400">選択</span>
        </>
      )}
    </button>
  );
}
