"use client";

import type { InningScore } from "@/types/match";

interface ScoreboardProps {
  teamAName: string;
  teamBName: string;
  innings: InningScore[];
  teamAScore: number;
  teamBScore: number;
}

/**
 * スコアボード表示コンポーネント
 * 野球のスコアボード形式でイニング別スコアを表示
 */
export function Scoreboard({
  teamAName,
  teamBName,
  innings,
  teamAScore,
  teamBScore,
}: ScoreboardProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px]">
              チーム
            </th>
            {innings.map((inning) => (
              <th
                key={inning.inning}
                className="border border-gray-300 px-2 py-1 text-center min-w-[32px]"
              >
                {inning.inning}
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-1 text-center min-w-[40px] bg-gray-200 font-bold">
              計
            </th>
          </tr>
        </thead>
        <tbody>
          {/* 自チーム */}
          <tr className="bg-green-50">
            <td className="border border-gray-300 px-2 py-1 font-medium truncate max-w-[120px]">
              {teamAName}
            </td>
            {innings.map((inning) => (
              <td
                key={inning.inning}
                className={`border border-gray-300 px-2 py-1 text-center ${
                  inning.teamAScore > 0 ? "font-bold text-green-700" : ""
                }`}
              >
                {inning.teamAScore}
              </td>
            ))}
            <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold text-lg">
              {teamAScore}
            </td>
          </tr>
          {/* 相手チーム */}
          <tr className="bg-red-50">
            <td className="border border-gray-300 px-2 py-1 font-medium truncate max-w-[120px]">
              {teamBName}
            </td>
            {innings.map((inning) => (
              <td
                key={inning.inning}
                className={`border border-gray-300 px-2 py-1 text-center ${
                  inning.teamBScore > 0 ? "font-bold text-red-700" : ""
                }`}
              >
                {inning.teamBScore}
              </td>
            ))}
            <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold text-lg">
              {teamBScore}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
