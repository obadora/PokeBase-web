/**
 * グラウンド上のポジションスロットコンポーネント
 * 円形スロットにポケモンを表示
 */

"use client";

import Image from "next/image";
import type { Position } from "@/types/position";
import type { TeamMemberWithPokemon } from "@/types/team";
import { POSITION_NAMES_JA } from "@/types/position";

interface FieldPositionProps {
  position: Position;
  member: TeamMemberWithPokemon | null;
  isSelected: boolean;
  onClick: () => void;
}

export function FieldPosition({ position, member, isSelected, onClick }: FieldPositionProps) {
  const positionName = POSITION_NAMES_JA[position];
  const isEmpty = !member;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-0.5
        w-16 h-20 rounded-lg transition-all
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
        ${isEmpty ? "hover:bg-white/30" : "hover:bg-white/50"}
      `}
    >
      {/* ポジション名 */}
      <span className="text-[10px] font-semibold text-white drop-shadow-md">{positionName}</span>

      {/* 円形スロット */}
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          border-2 transition-all shadow-md
          ${isEmpty ? "bg-white/50 border-white/70 border-dashed" : "bg-white border-green-500"}
          ${isSelected && isEmpty ? "bg-blue-100 border-blue-500" : ""}
        `}
      >
        {member ? (
          member.pokemon.sprites.frontDefault && (
            <Image
              src={member.pokemon.sprites.frontDefault}
              alt={member.pokemon.nameJa || member.pokemon.name}
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          )
        ) : (
          <span className="text-xl text-gray-400">+</span>
        )}
      </div>

      {/* ポケモン名（配置されている場合） */}
      {member && (
        <span className="text-[10px] text-white font-medium drop-shadow-md truncate max-w-16">
          {member.pokemon.nameJa || member.pokemon.name}
        </span>
      )}
    </button>
  );
}
