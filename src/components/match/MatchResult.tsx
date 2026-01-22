"use client";

import type { MatchResult, MatchHighlight } from "@/types/match";
import { Scoreboard } from "./Scoreboard";

interface MatchResultProps {
  teamAName: string;
  teamBName: string;
  result: MatchResult;
  reputationChange: number;
  onClose: () => void;
  onNextMatch?: () => void;
}

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
}: MatchResultProps) {
  const isWin = result.winner === "A";

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">試合結果</h2>
        <div
          className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${
            isWin
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isWin ? "勝利!" : "敗北..."}
        </div>
      </div>

      {/* スコア表示 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 text-3xl font-bold">
          <span className={isWin ? "text-green-600" : "text-gray-600"}>
            {teamAName}
          </span>
          <span className="text-4xl">
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

      {/* スコアボード */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">スコアボード</h3>
        <Scoreboard
          teamAName={teamAName}
          teamBName={teamBName}
          innings={result.innings}
          teamAScore={result.teamAScore}
          teamBScore={result.teamBScore}
        />
      </div>

      {/* ハイライト */}
      {result.highlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            ハイライト
          </h3>
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
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            isWin ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-600"
          }`}
        >
          <span className="text-lg">評判:</span>
          <span className="text-xl font-bold">
            {reputationChange > 0 ? "+" : ""}
            {reputationChange}pt
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
        >
          戻る
        </button>
        {onNextMatch && (
          <button
            onClick={onNextMatch}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            次の試合へ
          </button>
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
