/**
 * ポジション適性ランキングコンポーネント
 * トップ3のポジション適性を表示
 */

"use client";

import type { PositionFitness } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";

interface PositionRankingProps {
  positions: PositionFitness[];
}

export function PositionRanking({ positions }: PositionRankingProps) {
  // トップ3のみ表示
  const top3 = positions.slice(0, 3);

  return (
    <div className="space-y-4">
      {top3.map((position, index) => {
        const rankColors = [
          "bg-yellow-100 border-yellow-400",
          "bg-gray-100 border-gray-400",
          "bg-orange-100 border-orange-400",
        ];
        const rankIcons = ["🥇", "🥈", "🥉"];

        return (
          <div key={position.position} className={`border-2 rounded-lg p-4 ${rankColors[index]}`}>
            <div className="flex items-center justify-between">
              {/* ランクとポジション名 */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{rankIcons[index]}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {POSITION_NAMES_JA[position.position]}
                  </p>
                  <p className="text-sm text-gray-600">{position.position}</p>
                </div>
              </div>

              {/* スコアと星 */}
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">{position.score}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={i < position.stars ? "text-yellow-500" : "text-gray-300"}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
