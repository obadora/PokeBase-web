/**
 * 対戦カードプレビューコンポーネント
 * 次の対戦の詳細を表示
 */

"use client";

import Image from "next/image";
import type { TournamentMatch, OpponentTeam } from "@/types/opponent";
import { TYPE_NAMES_JA, TYPE_COLORS } from "@/types";

interface MatchPreviewProps {
  match: TournamentMatch;
  playerTeamName: string;
  playerTeamType?: string | null;
  onViewOpponent?: () => void;
  onStartMatch?: () => void;
}

interface TeamPreviewProps {
  name: string;
  type: string | null;
  averageStats?: number;
  memberCount?: number;
  isPlayer?: boolean;
  members?: OpponentTeam["members"];
}

function TeamPreview({
  name,
  type,
  averageStats,
  memberCount,
  isPlayer = false,
  members,
}: TeamPreviewProps) {
  return (
    <div
      className={`flex-1 p-6 rounded-xl ${
        isPlayer ? "bg-green-50 border-2 border-green-400" : "bg-gray-50 border-2 border-gray-200"
      }`}
    >
      {/* チーム名 */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
        {type && (
          <span
            className="inline-block mt-2 px-3 py-1 text-white rounded-full text-xs font-semibold"
            style={{ backgroundColor: TYPE_COLORS[type] || "#9CA3AF" }}
          >
            {TYPE_NAMES_JA[type] || type}
          </span>
        )}
        {isPlayer && (
          <span className="inline-block mt-2 ml-2 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
            あなたのチーム
          </span>
        )}
      </div>

      {/* チーム統計 */}
      {averageStats !== undefined && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">平均能力値</p>
          <p className="text-3xl font-bold text-gray-800">{averageStats}</p>
        </div>
      )}

      {/* メンバープレビュー */}
      {members && members.length > 0 && (
        <div className="flex justify-center -space-x-2">
          {members.slice(0, 5).map((member, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 overflow-hidden"
            >
              {member.pokemon.sprites.frontDefault ? (
                <Image
                  src={member.pokemon.sprites.frontDefault}
                  alt={member.pokemon.nameJa || member.pokemon.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  ?
                </div>
              )}
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs text-gray-600">+{members.length - 5}</span>
            </div>
          )}
        </div>
      )}

      {/* プレイヤーチームの場合は人数のみ */}
      {isPlayer && memberCount !== undefined && (
        <div className="text-center">
          <p className="text-sm text-gray-600">{memberCount}人</p>
        </div>
      )}
    </div>
  );
}

export function MatchPreview({
  match,
  playerTeamName,
  playerTeamType,
  onViewOpponent,
  onStartMatch,
}: MatchPreviewProps) {
  const opponent = match.team1 === null ? match.team2 : match.team1;

  if (!opponent) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-center text-gray-600">対戦相手がまだ決まっていません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* ラウンド表示 */}
      <div className="text-center mb-6">
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
          {match.round === 1
            ? "1回戦"
            : match.round === 2
              ? "2回戦"
              : match.round === 3
                ? "準決勝"
                : "決勝"}{" "}
          第{match.matchNumber}試合
        </span>
      </div>

      {/* チーム比較 */}
      <div className="flex items-stretch gap-8">
        {/* プレイヤーチーム */}
        <TeamPreview name={playerTeamName} type={playerTeamType || null} isPlayer={true} />

        {/* VS */}
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-400">VS</span>
        </div>

        {/* 対戦相手 */}
        <TeamPreview
          name={opponent.name}
          type={opponent.type}
          averageStats={opponent.averageStats}
          members={opponent.members}
        />
      </div>

      {/* アクションボタン */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onViewOpponent}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          相手チームを見る
        </button>
        <button
          onClick={onStartMatch}
          className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
        >
          試合開始
        </button>
      </div>
    </div>
  );
}
