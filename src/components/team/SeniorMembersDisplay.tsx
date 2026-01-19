/**
 * 上級生（2・3年生）表示コンポーネント
 * ランダム生成されたメンバーを表示のみ
 */

"use client";

import Image from "next/image";
import type { MemberSlotState, Grade } from "@/types/team";
import { GRADE_NAMES_JA } from "@/types/team";
import { POSITION_NAMES_JA } from "@/types/position";

interface SeniorMembersDisplayProps {
  grade: Grade;
  members: MemberSlotState[];
}

export function SeniorMembersDisplay({ grade, members }: SeniorMembersDisplayProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3">{GRADE_NAMES_JA[grade]}</h3>
      <div className="grid grid-cols-3 gap-2">
        {members.map((member, index) => (
          <div
            key={`${member.position}-${index}`}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
          >
            {/* ポケモン画像 */}
            <div className="w-10 h-10 flex-shrink-0">
              {member.pokemon?.sprites.frontDefault ? (
                <Image
                  src={member.pokemon.sprites.frontDefault}
                  alt={member.pokemon.nameJa || member.pokemon.name}
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
              )}
            </div>
            {/* ポジションと名前 */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{POSITION_NAMES_JA[member.position]}</p>
              <p className="text-sm font-medium text-gray-800 truncate">
                {member.pokemon?.nameJa || member.pokemon?.name || "???"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
