"use client";

import type { PitcherStats } from "@/types/match";

interface PitcherStatsTableProps {
  pitcher: PitcherStats;
  teamName: string;
  isWinner: boolean;
}

/**
 * 投手成績表示コンポーネント
 */
export function PitcherStatsTable({
  pitcher,
  isWinner,
}: PitcherStatsTableProps) {
  // 防御率を計算（自責点 × 9 / 投球回）
  const era =
    pitcher.inningsPitched > 0
      ? ((pitcher.earnedRuns * 9) / pitcher.inningsPitched).toFixed(2)
      : "-.--";

  // WHIP（(安打 + 四球) / 投球回）
  const whip =
    pitcher.inningsPitched > 0
      ? ((pitcher.hits + pitcher.walks) / pitcher.inningsPitched).toFixed(2)
      : "-.--";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left min-w-[120px]">
              投手
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="投球回">
              回
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="対戦打者">
              打者
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="球数">
              球数
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="被安打">
              被安
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="被本塁打">
              被本
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="奪三振">
              奪三振
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="与四球">
              四球
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="与死球">
              死球
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="暴投">
              暴投
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="失点">
              失点
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="自責点">
              自責
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center" title="防御率">
              防御率
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-300 px-3 py-2 font-medium">
              {pitcher.playerName}
              {isWinner && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                  勝
                </span>
              )}
              {!isWinner && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">
                  負
                </span>
              )}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center font-mono">
              {pitcher.inningsPitchedDisplay}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.battersFaced}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.pitchCount}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.hits}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center text-yellow-600 font-bold">
              {pitcher.homeruns}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center text-blue-600 font-bold">
              {pitcher.strikeouts}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.walks}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.hitByPitch}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center">
              {pitcher.wildPitches}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-bold">
              {pitcher.runs}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center text-red-600">
              {pitcher.earnedRuns}
            </td>
            <td className="border border-gray-300 px-2 py-2 text-center font-mono">
              {era}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 追加統計 */}
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span>
          WHIP: <span className="font-mono font-medium">{whip}</span>
        </span>
        <span>
          K/9:{" "}
          <span className="font-mono font-medium">
            {pitcher.inningsPitched > 0
              ? ((pitcher.strikeouts * 9) / pitcher.inningsPitched).toFixed(2)
              : "-.--"}
          </span>
        </span>
        <span>
          BB/9:{" "}
          <span className="font-mono font-medium">
            {pitcher.inningsPitched > 0
              ? ((pitcher.walks * 9) / pitcher.inningsPitched).toFixed(2)
              : "-.--"}
          </span>
        </span>
      </div>
    </div>
  );
}
