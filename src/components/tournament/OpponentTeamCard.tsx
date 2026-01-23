/**
 * 対戦相手チームカードコンポーネント
 * 対戦相手チームの概要を表示
 */

"use client";

import Image from "next/image";
import type { OpponentTeam } from "@/types/opponent";
import { TYPE_NAMES_JA, TYPE_COLORS } from "@/types";
import { POSITION_NAMES_JA } from "@/types/position";

interface OpponentTeamCardProps {
  team: OpponentTeam;
  onClick?: () => void;
  isSelected?: boolean;
}

export function OpponentTeamCard({ team, onClick, isSelected = false }: OpponentTeamCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 cursor-pointer transition-all hover:shadow-xl ${
        isSelected ? "ring-2 ring-green-500" : ""
      }`}
      onClick={onClick}
    >
      {/* チーム名とタイプ */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
        {team.type && (
          <span
            className="inline-block mt-1 px-3 py-1 text-white rounded-full text-xs font-semibold"
            style={{ backgroundColor: TYPE_COLORS[team.type] || "#9CA3AF" }}
          >
            {TYPE_NAMES_JA[team.type] || team.type}タイプ統一
          </span>
        )}
      </div>

      {/* チーム平均能力値 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">チーム平均能力値</span>
          <span className="font-bold text-gray-800">{team.averageStats}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
            style={{ width: `${Math.min(team.averageStats, 100)}%` }}
          />
        </div>
      </div>

      {/* メンバープレビュー（先頭3人） */}
      <div className="flex -space-x-2">
        {team.members.slice(0, 5).map((member, index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white overflow-hidden"
            title={`${POSITION_NAMES_JA[member.position]}: ${member.pokemon.nameJa || member.pokemon.name}`}
          >
            {member.pokemon.sprites.frontDefault ? (
              <Image
                src={member.pokemon.sprites.frontDefault}
                alt={member.pokemon.nameJa || member.pokemon.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                ?
              </div>
            )}
          </div>
        ))}
        {team.members.length > 5 && (
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
            <span className="text-xs text-gray-600">+{team.members.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
}
