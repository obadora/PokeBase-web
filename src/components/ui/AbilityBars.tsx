/**
 * 能力値バーコンポーネント
 * 能力値を視覚的なバーとランクで表示
 */

"use client";

import { convertToRank, getRankColor, getRankBgColor } from "@/lib/converter/rank";

interface AbilityItem {
  name: string;
  value: number;
}

interface AbilityBarsProps {
  abilities: AbilityItem[];
}

export function AbilityBars({ abilities }: AbilityBarsProps) {
  return (
    <div className="space-y-4">
      {abilities.map((ability, index) => {
        const rank = convertToRank(ability.value);
        const rankColor = getRankColor(rank);
        const rankBgColor = getRankBgColor(rank);

        return (
          <div key={index} className="flex items-center gap-4">
            {/* 能力名 */}
            <div className="w-24 text-sm font-semibold text-gray-700">{ability.name}</div>

            {/* プログレスバー */}
            <div className="flex-1 relative">
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${ability.value}%` }}
                >
                  <span className="text-white text-xs font-bold">{ability.value}</span>
                </div>
              </div>
            </div>

            {/* ランク表示 */}
            <div className={`w-12 h-8 ${rankBgColor} rounded-lg flex items-center justify-center`}>
              <span className={`text-lg font-bold ${rankColor}`}>{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
