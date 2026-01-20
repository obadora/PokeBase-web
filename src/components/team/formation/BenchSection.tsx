/**
 * ベンチメンバー表示コンポーネント
 * 横スクロール可能なカードリストでベンチメンバーを表示
 */

"use client";

import Image from "next/image";
import type { TeamMemberWithPokemon } from "@/types/team";
import { GRADE_NAMES_JA } from "@/types/team";
import { POSITION_NAMES_JA } from "@/types/position";
import type { Position } from "@/types/position";

interface BenchSectionProps {
  members: TeamMemberWithPokemon[];
  onMemberClick: (member: TeamMemberWithPokemon) => void;
}

export function BenchSection({ members, onMemberClick }: BenchSectionProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">ベンチメンバー</h3>
        <p className="text-sm text-gray-400 text-center py-4">ベンチメンバーがいません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">ベンチメンバー</h3>
        <span className="text-xs text-gray-500">{members.length}人</span>
      </div>

      {/* 横スクロール可能なカードリスト */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onMemberClick(member)}
              className="flex-shrink-0 flex flex-col items-center p-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all w-20"
            >
              {/* ポケモン画像 */}
              <div className="w-12 h-12 relative">
                {member.pokemon.sprites.frontDefault && (
                  <Image
                    src={member.pokemon.sprites.frontDefault}
                    alt={member.pokemon.nameJa || member.pokemon.name}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                )}
              </div>

              {/* ポケモン名 */}
              <span className="text-xs text-gray-700 truncate w-full text-center">
                {member.pokemon.nameJa || member.pokemon.name}
              </span>

              {/* 学年バッジ */}
              <span className="mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {GRADE_NAMES_JA[member.grade]}
              </span>

              {/* 現在のポジション */}
              <span className="text-[10px] text-gray-400">
                {POSITION_NAMES_JA[member.position as Position]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
