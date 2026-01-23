"use client";

import { useState, useEffect, useCallback } from "react";
import type { InningScore, MatchResult } from "@/types/match";

interface MatchProgressProps {
  teamAName: string;
  teamBName: string;
  result: MatchResult;
  onComplete: () => void;
}

type HalfInning = "top" | "bottom";

interface CurrentPlay {
  inning: number;
  half: HalfInning;
  displayedInnings: InningScore[];
  currentInningScore: {
    teamA: number | null;
    teamB: number | null;
  };
  isComplete: boolean;
}

/**
 * 試合進行表示コンポーネント
 * イニングごとにスコアが埋まっていくアニメーション
 */
export function MatchProgress({
  teamAName,
  teamBName,
  result,
  onComplete,
}: MatchProgressProps) {
  const [play, setPlay] = useState<CurrentPlay>({
    inning: 1,
    half: "top",
    displayedInnings: [],
    currentInningScore: { teamA: null, teamB: null },
    isComplete: false,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "fast" | "skip">("normal");

  // 累計スコア・ヒット・エラーを計算
  const calculateTotals = useCallback(
    (
      displayedInnings: InningScore[],
      currentInning: number,
      half: HalfInning,
      allInnings: InningScore[]
    ) => {
      // 完了したイニングの合計
      const completed = displayedInnings.reduce(
        (acc, inning) => ({
          teamAScore: acc.teamAScore + inning.teamAScore,
          teamBScore: acc.teamBScore + inning.teamBScore,
          teamAHits: acc.teamAHits + inning.teamAHits,
          teamBHits: acc.teamBHits + inning.teamBHits,
          teamAErrors: acc.teamAErrors + inning.teamAErrors,
          teamBErrors: acc.teamBErrors + inning.teamBErrors,
        }),
        { teamAScore: 0, teamBScore: 0, teamAHits: 0, teamBHits: 0, teamAErrors: 0, teamBErrors: 0 }
      );

      // 現在進行中のイニングのデータを追加
      const currentInningData = allInnings[currentInning - 1];
      if (currentInningData && displayedInnings.length < currentInning) {
        // 表が終わっていれば相手チームのデータを追加
        if (half === "bottom") {
          completed.teamBScore += currentInningData.teamBScore;
          completed.teamBHits += currentInningData.teamBHits;
          completed.teamBErrors += currentInningData.teamBErrors;
        }
      }

      return completed;
    },
    []
  );

  // 試合進行ロジック
  useEffect(() => {
    if (play.isComplete || isPaused) return;

    const delay = speed === "fast" ? 300 : speed === "skip" ? 50 : 800;

    const timer = setTimeout(() => {
      setPlay((prev) => {
        const currentInningData = result.innings[prev.inning - 1];

        if (prev.half === "top") {
          // 表の攻撃（相手チーム）→ 相手チームのスコアを表示
          return {
            ...prev,
            half: "bottom",
            currentInningScore: {
              teamA: null,
              teamB: currentInningData.teamBScore,
            },
          };
        } else {
          // 裏の攻撃（自チーム）→ 自チームのスコアを表示してイニング完了
          const completedInning: InningScore = {
            inning: prev.inning,
            teamAScore: currentInningData.teamAScore,
            teamBScore: currentInningData.teamBScore,
            teamAHits: currentInningData.teamAHits,
            teamBHits: currentInningData.teamBHits,
            teamAErrors: currentInningData.teamAErrors,
            teamBErrors: currentInningData.teamBErrors,
          };

          const newDisplayedInnings = [...prev.displayedInnings, completedInning];

          if (prev.inning >= result.innings.length) {
            // 試合終了
            return {
              ...prev,
              displayedInnings: newDisplayedInnings,
              currentInningScore: { teamA: null, teamB: null },
              isComplete: true,
            };
          }

          // 次のイニングへ
          return {
            inning: prev.inning + 1,
            half: "top",
            displayedInnings: newDisplayedInnings,
            currentInningScore: { teamA: null, teamB: null },
            isComplete: false,
          };
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [play, isPaused, speed, result.innings]);

  // 試合完了時のコールバック
  useEffect(() => {
    if (play.isComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [play.isComplete, onComplete]);

  const totals = calculateTotals(
    play.displayedInnings,
    play.inning,
    play.half,
    result.innings
  );

  // スキップ処理
  const handleSkip = () => {
    setPlay({
      inning: result.innings.length,
      half: "bottom",
      displayedInnings: result.innings,
      currentInningScore: { teamA: null, teamB: null },
      isComplete: true,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">試合中</h2>
        {!play.isComplete && (
          <p className="text-gray-500 mt-1">
            {play.inning}回{play.half === "top" ? "表" : "裏"}
          </p>
        )}
        {play.isComplete && (
          <p className="text-green-600 font-bold mt-1">試合終了!</p>
        )}
      </div>

      {/* 現在のスコア */}
      <div className="flex items-center justify-center gap-6 mb-6 py-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">{teamAName}</p>
          <p className="text-4xl font-bold text-green-600">{totals.teamAScore}</p>
        </div>
        <div className="text-2xl font-bold text-gray-400">-</div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">{teamBName}</p>
          <p className="text-4xl font-bold text-red-600">{totals.teamBScore}</p>
        </div>
      </div>

      {/* スコアボード（進行中） */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 text-left min-w-[80px]">
                チーム
              </th>
              {result.innings.map((_, idx) => (
                <th
                  key={idx}
                  className={`border border-gray-300 px-2 py-1 text-center min-w-[28px] ${
                    idx + 1 === play.inning && !play.isComplete
                      ? "bg-yellow-100"
                      : ""
                  }`}
                >
                  {idx + 1}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
                R
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
                H
              </th>
              <th className="border border-gray-300 px-2 py-1 text-center min-w-[32px] bg-gray-200 font-bold">
                E
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 相手チーム（先攻・表）- 上段 */}
            <tr className="bg-red-50">
              <td className="border border-gray-300 px-2 py-1 font-medium text-xs truncate">
                {teamBName}
              </td>
              {result.innings.map((_, idx) => {
                const displayedInning = play.displayedInnings[idx];
                const isCurrent = idx + 1 === play.inning && !play.isComplete;
                const showScore =
                  displayedInning !== undefined ||
                  (isCurrent && play.currentInningScore.teamB !== null);

                let score: number | string = "";
                if (displayedInning) {
                  score = displayedInning.teamBScore;
                } else if (isCurrent && play.currentInningScore.teamB !== null) {
                  score = play.currentInningScore.teamB;
                }

                return (
                  <td
                    key={idx}
                    className={`border border-gray-300 px-2 py-1 text-center ${
                      isCurrent ? "bg-yellow-100" : ""
                    } ${
                      showScore && score !== "" && Number(score) > 0
                        ? "font-bold text-red-700"
                        : ""
                    }`}
                  >
                    {showScore ? score : ""}
                    {isCurrent && play.half === "top" && score === "" && (
                      <span className="animate-pulse">-</span>
                    )}
                  </td>
                );
              })}
              <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold">
                {totals.teamBScore}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold">
                {totals.teamBHits}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center bg-red-100 font-bold">
                {totals.teamBErrors}
              </td>
            </tr>
            {/* 自チーム（後攻・裏）- 下段 */}
            <tr className="bg-green-50">
              <td className="border border-gray-300 px-2 py-1 font-medium text-xs truncate">
                {teamAName}
              </td>
              {result.innings.map((_, idx) => {
                const displayedInning = play.displayedInnings[idx];
                const isCurrent = idx + 1 === play.inning && !play.isComplete;
                const showScore =
                  displayedInning !== undefined ||
                  (isCurrent && play.half === "bottom");

                let score: number | string = "";
                if (displayedInning) {
                  score = displayedInning.teamAScore;
                } else if (isCurrent && play.currentInningScore.teamA !== null) {
                  score = play.currentInningScore.teamA;
                }

                return (
                  <td
                    key={idx}
                    className={`border border-gray-300 px-2 py-1 text-center ${
                      isCurrent ? "bg-yellow-100" : ""
                    } ${
                      showScore && score !== "" && Number(score) > 0
                        ? "font-bold text-green-700"
                        : ""
                    }`}
                  >
                    {showScore ? score : ""}
                    {isCurrent && play.half === "bottom" && score === "" && (
                      <span className="animate-pulse">-</span>
                    )}
                  </td>
                );
              })}
              <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold">
                {totals.teamAScore}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold">
                {totals.teamAHits}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center bg-green-100 font-bold">
                {totals.teamAErrors}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* イニング実況 */}
      {!play.isComplete && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-center">
            {play.half === "top" ? (
              <>
                <span className="font-bold text-red-600">{teamBName}</span>
                の攻撃中...
              </>
            ) : (
              <>
                <span className="font-bold text-green-600">{teamAName}</span>
                の攻撃中...
              </>
            )}
          </p>
        </div>
      )}

      {/* コントロールボタン */}
      {!play.isComplete && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm"
          >
            {isPaused ? "再開" : "一時停止"}
          </button>
          <button
            onClick={() => setSpeed(speed === "normal" ? "fast" : "normal")}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              speed === "fast"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {speed === "fast" ? "2倍速" : "通常"}
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
          >
            スキップ
          </button>
        </div>
      )}

      {/* 試合終了時のメッセージ */}
      {play.isComplete && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">結果画面に移動します...</p>
        </div>
      )}
    </div>
  );
}
