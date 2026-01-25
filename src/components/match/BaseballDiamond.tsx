/**
 * 野球ダイヤモンドコンポーネント
 * ランナー位置とアウトカウントを表示
 */

"use client";

import Image from "next/image";
import type { BasesState, AtBatResult } from "@/types/match";
import { AT_BAT_RESULT_LABELS, isGroundout, isFlyout } from "@/types/match";

interface BaseballDiamondProps {
  /** 塁の状態 */
  bases: BasesState;
  /** アウトカウント */
  outs: number;
  /** 現在の打者情報 */
  currentBatter?: {
    name: string;
    spriteUrl: string | null;
    battingOrder: number;
  };
  /** 打席結果（表示用） */
  atBatResult?: AtBatResult;
  /** 自チームの攻撃かどうか */
  isTeamABatting: boolean;
}

export function BaseballDiamond({
  bases,
  outs,
  currentBatter,
  atBatResult,
  isTeamABatting,
}: BaseballDiamondProps) {
  // ランナースプライトのサイズ
  const runnerSize = 28;

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* アウトカウント */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs text-gray-600 mr-1">OUT</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < outs ? "bg-yellow-400 border-yellow-500" : "bg-white border-gray-300"
            }`}
          />
        ))}
      </div>

      {/* グラウンド */}
      <div className="relative aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* 芝生背景 */}
          <rect x="0" y="0" width="100" height="100" fill="#4ade80" />

          {/* 外野のアーチ */}
          <path
            d="M 5 45 Q 50 0 95 45"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
          />

          {/* 内野（ダイヤモンド） */}
          <polygon
            points="50,90 80,55 50,35 20,55"
            fill="rgba(210,180,140,0.5)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.8"
          />

          {/* ベースライン */}
          <line x1="50" y1="90" x2="80" y2="55" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="50" y1="90" x2="20" y2="55" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="80" y1="55" x2="50" y2="35" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="50" y2="35" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* マウンド */}
          <circle cx="50" cy="60" r="4" fill="rgba(210,180,140,0.7)" />

          {/* ホームベース */}
          <polygon points="50,90 47,87 47,85 53,85 53,87" fill="white" opacity="0.9" />

          {/* 一塁ベース */}
          <rect
            x="77"
            y="52"
            width="6"
            height="6"
            fill={bases.first ? "#fbbf24" : "white"}
            opacity="0.9"
            className="transition-colors"
          />

          {/* 二塁ベース */}
          <rect
            x="47"
            y="32"
            width="6"
            height="6"
            fill={bases.second ? "#fbbf24" : "white"}
            opacity="0.9"
            className="transition-colors"
          />

          {/* 三塁ベース */}
          <rect
            x="17"
            y="52"
            width="6"
            height="6"
            fill={bases.third ? "#fbbf24" : "white"}
            opacity="0.9"
            className="transition-colors"
          />
        </svg>

        {/* ランナースプライト（一塁） */}
        {bases.first && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: "85%", top: "48%" }}
          >
            {bases.first.spriteUrl ? (
              <Image
                src={bases.first.spriteUrl}
                alt={bases.first.name}
                width={runnerSize}
                height={runnerSize}
                className="drop-shadow-md"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                {bases.first.batterIndex + 1}
              </div>
            )}
          </div>
        )}

        {/* ランナースプライト（二塁） */}
        {bases.second && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: "50%", top: "25%" }}
          >
            {bases.second.spriteUrl ? (
              <Image
                src={bases.second.spriteUrl}
                alt={bases.second.name}
                width={runnerSize}
                height={runnerSize}
                className="drop-shadow-md"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                {bases.second.batterIndex + 1}
              </div>
            )}
          </div>
        )}

        {/* ランナースプライト（三塁） */}
        {bases.third && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: "15%", top: "48%" }}
          >
            {bases.third.spriteUrl ? (
              <Image
                src={bases.third.spriteUrl}
                alt={bases.third.name}
                width={runnerSize}
                height={runnerSize}
                className="drop-shadow-md"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                {bases.third.batterIndex + 1}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 打者情報 */}
      {currentBatter && (
        <div className={`mt-3 p-2 rounded-lg ${isTeamABatting ? "bg-green-100" : "bg-red-100"}`}>
          <div className="flex items-center justify-center gap-2">
            {currentBatter.spriteUrl && (
              <Image
                src={currentBatter.spriteUrl}
                alt={currentBatter.name}
                width={32}
                height={32}
              />
            )}
            <div className="text-center">
              <span className="text-xs text-gray-500">{currentBatter.battingOrder}番</span>
              <p className="font-bold text-sm">{currentBatter.name}</p>
            </div>
          </div>

          {/* 打席結果 */}
          {atBatResult && (
            <div className="mt-1 text-center">
              <span
                className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${getResultStyle(
                  atBatResult
                )}`}
              >
                {AT_BAT_RESULT_LABELS[atBatResult]}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 打席結果に応じたスタイルを返す */
function getResultStyle(result: AtBatResult): string {
  // ゴロアウト・フライアウト判定
  if (isGroundout(result) || isFlyout(result)) {
    return "bg-gray-400 text-white";
  }

  switch (result) {
    case "homerun":
      return "bg-yellow-400 text-yellow-900";
    case "triple":
    case "double":
    case "single":
      return "bg-blue-400 text-white";
    case "walk":
    case "hitByPitch":
      return "bg-green-400 text-white";
    case "strikeout":
      return "bg-red-500 text-white";
    case "fieldersChoice":
      return "bg-gray-400 text-white";
    case "sacrifice":
    case "sacrificeFly":
      return "bg-purple-400 text-white";
    case "error":
      return "bg-orange-400 text-white";
    default:
      return "bg-gray-300 text-gray-700";
  }
}
