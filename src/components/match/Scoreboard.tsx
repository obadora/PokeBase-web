"use client";

import type { InningScore, TeamStats } from "@/types/match";

interface ScoreboardProps {
  teamAName: string;
  teamBName: string;
  innings: InningScore[];
  teamAScore: number;
  teamBScore: number;
  teamAStats?: TeamStats;
  teamBStats?: TeamStats;
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
  teamAStats,
  teamBStats,
}: ScoreboardProps) {
  const showStats = teamAStats && teamBStats;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px]">チーム</th>
            {innings.map((inning) => (
              <th
                key={inning.inning}
                className="border border-gray-300 px-2 py-1 text-center min-w-[28px]"
              >
                {inning.inning}
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
              R
            </th>
            {showStats && (
              <>
                <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
                  H
                </th>
                <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
                  E
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {/* 相手チーム（先攻・表）- 上段 */}
          <tr className="bg-red-50">
            <td className="border border-gray-300 px-2 py-1 font-medium truncate max-w-[100px]">
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
            {showStats && (
              <>
                <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold">
                  {teamBStats.hits}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold">
                  {teamBStats.errors}
                </td>
              </>
            )}
          </tr>
          {/* 自チーム（後攻・裏）- 下段 */}
          <tr className="bg-green-50">
            <td className="border border-gray-300 px-2 py-1 font-medium truncate max-w-[100px]">
              {teamAName}
            </td>
            {innings.map((inning) => (
              <td
                key={inning.inning}
                className={`border border-gray-300 px-2 py-1 text-center ${
                  inning.teamASkipped
                    ? "text-gray-500"
                    : inning.teamAScore > 0
                      ? "font-bold text-green-700"
                      : ""
                }`}
              >
                {inning.teamASkipped ? "X" : inning.teamAScore}
              </td>
            ))}
            <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold text-lg">
              {teamAScore}
            </td>
            {showStats && (
              <>
                <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold">
                  {teamAStats.hits}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold">
                  {teamAStats.errors}
                </td>
              </>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
