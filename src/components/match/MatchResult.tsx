"use client";

import { useState } from "react";
import type { MatchResult, MatchHighlight } from "@/types/match";
import { Scoreboard } from "./Scoreboard";
import { BatterStatsTable } from "./BatterStatsTable";
import { PitcherStatsTable } from "./PitcherStatsTable";

interface MatchResultProps {
  teamAName: string;
  teamBName: string;
  result: MatchResult;
  reputationChange: number;
  onClose: () => void;
  onNextMatch?: () => void;
  onRematch?: () => void;
}

type ResultTab = "summary" | "teamABatters" | "teamBBatters" | "pitchers";

/**
 * 試合結果表示コンポーネント
 */
export function MatchResultDisplay({
  teamAName,
  teamBName,
  result,
  reputationChange,
  onClose,
  onNextMatch,
  onRematch,
}: MatchResultProps) {
  const isWin = result.winner === "A";
  const isDraw = result.winner === "draw";
  const [activeTab, setActiveTab] = useState<ResultTab>("summary");

  const tabs: { id: ResultTab; label: string }[] = [
    { id: "summary", label: "概要" },
    { id: "teamABatters", label: `${teamAName}打撃` },
    { id: "teamBBatters", label: `${teamBName}打撃` },
    { id: "pitchers", label: "投手成績" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">試合結果</h2>
        <div
          className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${
            isDraw
              ? "bg-yellow-100 text-yellow-700"
              : isWin
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {isDraw ? "引き分け" : isWin ? "勝利!" : "敗北..."}
        </div>
      </div>

      {/* スコア表示 */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-4 text-2xl font-bold">
          <span className={isWin ? "text-green-600" : "text-gray-600"}>
            {teamAName}
          </span>
          <span className="text-3xl">
            <span className={isWin ? "text-green-600" : "text-gray-600"}>
              {result.teamAScore}
            </span>
            <span className="text-gray-400 mx-2">-</span>
            <span className={!isWin ? "text-red-600" : "text-gray-600"}>
              {result.teamBScore}
            </span>
          </span>
          <span className={!isWin ? "text-red-600" : "text-gray-600"}>
            {teamBName}
          </span>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="mb-6 min-h-[300px]">
        {activeTab === "summary" && (
          <SummaryTab
            teamAName={teamAName}
            teamBName={teamBName}
            result={result}
            reputationChange={reputationChange}
            isWin={isWin}
            isDraw={isDraw}
          />
        )}

        {activeTab === "teamABatters" && result.teamABatters && (
          <BatterStatsTable
            batters={result.teamABatters}
            teamName={teamAName}
            innings={result.innings.length}
          />
        )}

        {activeTab === "teamBBatters" && result.teamBBatters && (
          <BatterStatsTable
            batters={result.teamBBatters}
            teamName={teamBName}
            innings={result.innings.length}
          />
        )}

        {activeTab === "pitchers" && (
          <div className="space-y-6">
            {result.teamAPitcher && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  {teamAName} 投手
                </h4>
                <PitcherStatsTable
                  pitcher={result.teamAPitcher}
                  teamName={teamAName}
                  isWinner={isWin}
                />
              </div>
            )}
            {result.teamBPitcher && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  {teamBName} 投手
                </h4>
                <PitcherStatsTable
                  pitcher={result.teamBPitcher}
                  teamName={teamBName}
                  isWinner={!isWin}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3 justify-center pt-4 border-t border-gray-200">
        {!onRematch && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            戻る
          </button>
        )}
        {onNextMatch && (
          <button
            onClick={onNextMatch}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            次の試合へ
          </button>
        )}
        {onRematch && (
          <button
            onClick={onRematch}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            再試合
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 概要タブ
 */
function SummaryTab({
  teamAName,
  teamBName,
  result,
  reputationChange,
  isWin,
  isDraw,
}: {
  teamAName: string;
  teamBName: string;
  result: MatchResult;
  reputationChange: number;
  isWin: boolean;
  isDraw: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* スコアボード */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">スコアボード</h3>
        <Scoreboard
          teamAName={teamAName}
          teamBName={teamBName}
          innings={result.innings}
          teamAScore={result.teamAScore}
          teamBScore={result.teamBScore}
          teamAStats={result.teamAStats}
          teamBStats={result.teamBStats}
        />
      </div>

      {/* ハイライト */}
      {result.highlights.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">ハイライト</h3>
          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {result.highlights.slice(0, 5).map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <HighlightIcon type={highlight.type} />
                  <span>
                    <span className="font-medium text-gray-500">
                      {highlight.inning}回:
                    </span>{" "}
                    {highlight.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 評判ポイント変動 */}
      <div className="text-center">
        {isDraw ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700">
            <span className="text-lg">再試合が必要です</span>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              reputationChange > 0
                ? "bg-yellow-50 text-yellow-700"
                : reputationChange < 0
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-600"
            }`}
          >
            <span className="text-lg">評判:</span>
            <span className="text-xl font-bold">
              {reputationChange > 0 ? "+" : ""}
              {reputationChange}pt
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ハイライトアイコン
 */
function HighlightIcon({ type }: { type: MatchHighlight["type"] }) {
  switch (type) {
    case "homerun":
      return <span className="text-yellow-500">&#9733;</span>;
    case "hit":
      return <span className="text-green-500">&#10004;</span>;
    case "strikeout":
      return <span className="text-blue-500">K</span>;
    case "defense":
      return <span className="text-purple-500">&#9650;</span>;
    case "error":
      return <span className="text-red-500">E</span>;
    default:
      return <span className="text-gray-400">&#8226;</span>;
  }
}
