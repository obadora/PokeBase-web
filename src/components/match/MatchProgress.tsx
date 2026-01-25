"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { InningScore, MatchResult, AtBat, BasesState } from "@/types/match";
import { BaseballDiamond } from "./BaseballDiamond";

interface MatchProgressProps {
  teamAName: string;
  teamBName: string;
  result: MatchResult;
  onComplete: () => void;
}

type HalfInning = "top" | "bottom";

/** 全打席データ（イニングと表裏でフラット化） */
interface FlatAtBat {
  inning: number;
  half: HalfInning;
  atBat: AtBat;
  atBatIndexInHalf: number;
}

interface CurrentPlay {
  inning: number;
  half: HalfInning;
  /** 現在のハーフイニング内の打席インデックス */
  atBatIndex: number;
  /** 現在の打席データ */
  currentAtBat: AtBat | null;
  /** 表示済みのイニングスコア */
  displayedInnings: InningScore[];
  /** 現在進行中のイニングのスコア */
  currentInningScore: {
    teamA: number | null;
    teamB: number | null;
  };
  /** 試合終了フラグ */
  isComplete: boolean;
  /** 現在の塁状態 */
  bases: BasesState;
  /** 現在のアウトカウント */
  outs: number;
  /** チェンジ表示中かどうか */
  showingChange: boolean;
}

/**
 * 試合進行表示コンポーネント
 * 打席ごとにアニメーション表示
 */
export function MatchProgress({ teamAName, teamBName, result, onComplete }: MatchProgressProps) {
  // 打席データをフラット化（イニング・表裏順）
  const flatAtBats = useMemo(() => {
    const atBats: FlatAtBat[] = [];

    for (let inning = 1; inning <= result.innings.length; inning++) {
      const inningData = result.innings[inning - 1];

      // 表（相手チーム = teamB）の打席
      if (result.teamBBatters) {
        for (const batter of result.teamBBatters) {
          for (const ab of batter.atBats) {
            if (ab.inning === inning) {
              atBats.push({
                inning,
                half: "top",
                atBat: ab,
                atBatIndexInHalf: ab.atBatOrderInHalfInning ?? 0,
              });
            }
          }
        }
      }

      // 裏（自チーム = teamA）の打席（9回裏スキップの場合は追加しない）
      if (!inningData.teamASkipped && result.teamABatters) {
        for (const batter of result.teamABatters) {
          for (const ab of batter.atBats) {
            if (ab.inning === inning) {
              atBats.push({
                inning,
                half: "bottom",
                atBat: ab,
                atBatIndexInHalf: ab.atBatOrderInHalfInning ?? 0,
              });
            }
          }
        }
      }
    }

    // イニング・表裏・打席順でソート（atBatOrderInHalfInningを使用）
    atBats.sort((a, b) => {
      if (a.inning !== b.inning) return a.inning - b.inning;
      if (a.half !== b.half) return a.half === "top" ? -1 : 1;
      return a.atBatIndexInHalf - b.atBatIndexInHalf;
    });

    return atBats;
  }, [result]);

  // 現在の打席インデックス（全打席通し番号）
  const [currentFlatIndex, setCurrentFlatIndex] = useState(-1);

  const [play, setPlay] = useState<CurrentPlay>({
    inning: 1,
    half: "top",
    atBatIndex: 0,
    currentAtBat: null,
    displayedInnings: [],
    currentInningScore: { teamA: null, teamB: null },
    isComplete: false,
    bases: { first: null, second: null, third: null },
    outs: 0,
    showingChange: false,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "fast" | "skip">("normal");

  // 累計スコア・ヒット・エラーを計算
  const calculateTotals = useCallback(
    (
      displayedInnings: InningScore[],
      currentInning: number,
      half: HalfInning,
      allInnings: InningScore[],
      currentInningRuns: { teamA: number; teamB: number }
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
        {
          teamAScore: 0,
          teamBScore: 0,
          teamAHits: 0,
          teamBHits: 0,
          teamAErrors: 0,
          teamBErrors: 0,
        }
      );

      // 進行中のイニングの得点を追加
      completed.teamAScore += currentInningRuns.teamA;
      completed.teamBScore += currentInningRuns.teamB;

      return completed;
    },
    []
  );

  // 現在のハーフイニングの得点を計算
  const currentInningRuns = useMemo(() => {
    let teamARuns = 0;
    let teamBRuns = 0;

    for (let i = 0; i <= currentFlatIndex; i++) {
      const flatAtBat = flatAtBats[i];
      if (!flatAtBat) continue;

      if (flatAtBat.inning === play.inning) {
        if (flatAtBat.half === "top") {
          teamBRuns += flatAtBat.atBat.rbi;
        } else {
          teamARuns += flatAtBat.atBat.rbi;
        }
      }
    }

    return { teamA: teamARuns, teamB: teamBRuns };
  }, [currentFlatIndex, flatAtBats, play.inning]);

  // 試合進行ロジック
  useEffect(() => {
    if (play.isComplete || isPaused) return;

    // チェンジ表示中は待機
    if (play.showingChange) {
      const changeDelay = speed === "skip" ? 100 : speed === "fast" ? 500 : 1000;
      const timer = setTimeout(() => {
        setPlay((prev) => ({
          ...prev,
          showingChange: false,
        }));
      }, changeDelay);
      return () => clearTimeout(timer);
    }

    const delay = speed === "fast" ? 700 : speed === "skip" ? 50 : 1500;

    const timer = setTimeout(() => {
      const nextIndex = currentFlatIndex + 1;

      // 全打席終了
      if (nextIndex >= flatAtBats.length) {
        setPlay((prev) => ({
          ...prev,
          displayedInnings: result.innings,
          isComplete: true,
          currentAtBat: null,
        }));
        return;
      }

      const nextAtBat = flatAtBats[nextIndex];
      const currentAtBat = currentFlatIndex >= 0 ? flatAtBats[currentFlatIndex] : null;

      // イニングまたは表裏が変わった場合
      const inningChanged =
        currentAtBat &&
        (nextAtBat.inning !== currentAtBat.inning || nextAtBat.half !== currentAtBat.half);

      if (inningChanged && currentAtBat) {
        // 前のハーフイニングのスコアを確定
        const prevInningData = result.innings[currentAtBat.inning - 1];

        if (currentAtBat.half === "bottom") {
          // 裏が終了 → イニング完了、チェンジ表示
          setPlay((prev) => ({
            ...prev,
            displayedInnings: [...prev.displayedInnings, prevInningData],
            inning: nextAtBat.inning,
            half: nextAtBat.half,
            atBatIndex: 0,
            bases: { first: null, second: null, third: null },
            outs: 0,
            currentAtBat: null,
            currentInningScore: { teamA: null, teamB: null },
            showingChange: true,
          }));
        } else {
          // 表が終了 → 裏へ、チェンジ表示
          setPlay((prev) => ({
            ...prev,
            inning: nextAtBat.inning,
            half: nextAtBat.half,
            atBatIndex: 0,
            bases: { first: null, second: null, third: null },
            outs: 0,
            currentAtBat: null,
            currentInningScore: {
              teamA: null,
              teamB: prevInningData.teamBScore,
            },
            showingChange: true,
          }));
        }
        // インデックスは進めておく（次のタイマーで打席を表示）
        setCurrentFlatIndex(nextIndex);
      } else {
        // 同じハーフイニング内 - 打席前の状態を表示
        setPlay((prev) => ({
          ...prev,
          inning: nextAtBat.inning,
          half: nextAtBat.half,
          atBatIndex: nextAtBat.atBatIndexInHalf,
          currentAtBat: nextAtBat.atBat,
          bases: nextAtBat.atBat.basesBeforeAtBat || {
            first: null,
            second: null,
            third: null,
          },
          outs: nextAtBat.atBat.outsBeforeAtBat ?? 0,
        }));
        setCurrentFlatIndex(nextIndex);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    play.isComplete,
    play.showingChange,
    isPaused,
    speed,
    currentFlatIndex,
    flatAtBats,
    result.innings,
  ]);

  // チェンジ後に最初の打席を表示
  useEffect(() => {
    if (play.showingChange) return;
    if (play.isComplete) return;

    // チェンジ表示が終わった後、現在の打席を表示
    const currentAtBat = flatAtBats[currentFlatIndex];
    if (currentAtBat && play.currentAtBat === null && !play.showingChange) {
      setPlay((prev) => ({
        ...prev,
        currentAtBat: currentAtBat.atBat,
        bases: currentAtBat.atBat.basesBeforeAtBat || {
          first: null,
          second: null,
          third: null,
        },
        outs: currentAtBat.atBat.outsBeforeAtBat ?? 0,
      }));
    }
  }, [play.showingChange, play.isComplete, play.currentAtBat, currentFlatIndex, flatAtBats]);

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
    result.innings,
    currentInningRuns
  );

  // スキップ処理
  const handleSkip = () => {
    setCurrentFlatIndex(flatAtBats.length);
    setPlay({
      inning: result.innings.length,
      half: "bottom",
      atBatIndex: 0,
      currentAtBat: null,
      displayedInnings: result.innings,
      currentInningScore: { teamA: null, teamB: null },
      isComplete: true,
      bases: { first: null, second: null, third: null },
      outs: 0,
      showingChange: false,
    });
  };

  // 現在の打者情報
  const currentBatter = play.currentAtBat?.batter
    ? {
        name: play.currentAtBat.batter.name,
        spriteUrl: play.currentAtBat.batter.spriteUrl,
        battingOrder: play.currentAtBat.batter.index + 1,
      }
    : undefined;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">試合中</h2>
        {!play.isComplete && (
          <p className="text-gray-500 mt-1">
            {play.inning}回{play.half === "top" ? "表" : "裏"}
          </p>
        )}
        {play.isComplete && <p className="text-green-600 font-bold mt-1">試合終了!</p>}
      </div>

      {/* メインコンテンツ: グラウンドとスコアボード */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* 左: グラウンド表示 */}
        <div className="flex-shrink-0 md:w-64 relative">
          {/* チェンジ表示オーバーレイ */}
          {play.showingChange && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="bg-white px-6 py-3 rounded-lg shadow-lg">
                <p className="text-2xl font-bold text-gray-800">チェンジ</p>
              </div>
            </div>
          )}
          <BaseballDiamond
            bases={play.bases}
            outs={play.outs}
            currentBatter={currentBatter}
            atBatResult={play.currentAtBat?.result}
            isTeamABatting={play.half === "bottom"}
          />
        </div>

        {/* 右: スコアボードと現在スコア */}
        <div className="flex-1">
          {/* 現在のスコア - 先攻（相手）を左、後攻（自チーム）を右に配置 */}
          <div className="flex items-center justify-center gap-6 mb-4 py-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{teamBName}</p>
              <p className="text-3xl font-bold text-red-600">{totals.teamBScore}</p>
            </div>
            <div className="text-xl font-bold text-gray-400">-</div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{teamAName}</p>
              <p className="text-3xl font-bold text-green-600">{totals.teamAScore}</p>
            </div>
          </div>

          {/* スコアボード（進行中） */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-1 py-1 text-left min-w-[60px]">
                    チーム
                  </th>
                  {result.innings.map((_, idx) => (
                    <th
                      key={idx}
                      className={`border border-gray-300 px-1 py-1 text-center min-w-[22px] ${
                        idx + 1 === play.inning && !play.isComplete ? "bg-yellow-100" : ""
                      }`}
                    >
                      {idx + 1}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-1 py-1 text-center min-w-[24px] bg-gray-200 font-bold">
                    R
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center min-w-[24px] bg-gray-200 font-bold">
                    H
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center min-w-[24px] bg-gray-200 font-bold">
                    E
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 相手チーム（先攻・表）- 上段 */}
                <tr className="bg-red-50">
                  <td className="border border-gray-300 px-1 py-1 font-medium text-xs truncate">
                    {teamBName}
                  </td>
                  {result.innings.map((inningData, idx) => {
                    const displayedInning = play.displayedInnings[idx];
                    const isCurrent = idx + 1 === play.inning && !play.isComplete;
                    const isTopComplete =
                      displayedInning !== undefined || (isCurrent && play.half === "bottom");

                    let score: number | string = "";
                    if (displayedInning) {
                      score = displayedInning.teamBScore;
                    } else if (isCurrent && play.half === "bottom") {
                      score = inningData.teamBScore;
                    } else if (isCurrent && play.half === "top") {
                      score = currentInningRuns.teamB;
                    }

                    return (
                      <td
                        key={idx}
                        className={`border border-gray-300 px-1 py-1 text-center ${
                          isCurrent ? "bg-yellow-100" : ""
                        } ${isTopComplete && Number(score) > 0 ? "font-bold text-red-700" : ""}`}
                      >
                        {isTopComplete || (isCurrent && play.half === "top") ? score : ""}
                        {isCurrent && play.half === "top" && !isTopComplete && score === "" && (
                          <span className="animate-pulse">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-1 py-1 text-center bg-red-100 font-bold">
                    {totals.teamBScore}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center bg-red-100 font-bold">
                    {totals.teamBHits}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center bg-red-100 font-bold">
                    {totals.teamBErrors}
                  </td>
                </tr>
                {/* 自チーム（後攻・裏）- 下段 */}
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-1 py-1 font-medium text-xs truncate">
                    {teamAName}
                  </td>
                  {result.innings.map((inningData, idx) => {
                    const displayedInning = play.displayedInnings[idx];
                    const isCurrent = idx + 1 === play.inning && !play.isComplete;
                    const isBottomComplete = displayedInning !== undefined;
                    const showInProgress = isCurrent && play.half === "bottom";

                    let score: number | string = "";
                    if (displayedInning) {
                      score = displayedInning.teamAScore;
                    } else if (showInProgress) {
                      score = currentInningRuns.teamA;
                    }

                    // 9回裏スキップの場合
                    const isSkipped = inningData.teamASkipped;

                    return (
                      <td
                        key={idx}
                        className={`border border-gray-300 px-1 py-1 text-center ${
                          isCurrent ? "bg-yellow-100" : ""
                        } ${
                          isBottomComplete && Number(score) > 0 ? "font-bold text-green-700" : ""
                        }`}
                      >
                        {isSkipped && displayedInning
                          ? "X"
                          : isBottomComplete || showInProgress
                            ? score
                            : ""}
                        {showInProgress && score === "" && !isSkipped && (
                          <span className="animate-pulse">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-1 py-1 text-center bg-green-100 font-bold">
                    {totals.teamAScore}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center bg-green-100 font-bold">
                    {totals.teamAHits}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center bg-green-100 font-bold">
                    {totals.teamAErrors}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* イニング実況 */}
      {!play.isComplete && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-center">
            {play.showingChange ? (
              <span className="font-bold text-gray-600">攻守交代</span>
            ) : play.half === "top" ? (
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
