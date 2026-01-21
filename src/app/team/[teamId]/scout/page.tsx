/**
 * スカウト画面
 * 評判システムに基づいてメンバーをスカウトする
 */

"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Team, TeamMember } from "@/types/team";
import type { Position } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";
import {
  getReputationRank,
  getMemberLimit,
  getReputationStars,
  getPointsToNextRank,
  REPUTATION_POINTS,
} from "@/types/reputation";
import { getTeamById, getTeamMembers, updateTeamReputation, addTeamMembers } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { generateScoutCandidates, ScoutCandidate } from "@/lib/services/scout";

interface ScoutPageProps {
  params: Promise<{ teamId: string }>;
}

export default function ScoutPage({ params }: ScoutPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [candidates, setCandidates] = useState<ScoutCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScouting, setIsScouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1年生のメンバー数を取得
  const firstYearMembers = members.filter((m) => m.grade === 1);
  const firstYearCount = firstYearMembers.length;

  // 評判に基づく上限
  const memberLimit = team ? getMemberLimit(team.reputation) : 6;
  const canScout = firstYearCount < memberLimit;

  // スカウト候補を生成
  const generateCandidates = useCallback(() => {
    if (allPokemon.length === 0) return;

    const existingPokemonIds = members.map((m) => m.pokemon_id);
    const newCandidates = generateScoutCandidates(allPokemon, {
      count: 3,
      excludeIds: existingPokemonIds,
    });
    setCandidates(newCandidates);
  }, [allPokemon, members]);

  // データ読み込み
  useEffect(() => {
    async function loadData() {
      try {
        // チーム情報を取得
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) throw teamError;
        if (!teamData) throw new Error("チームが見つかりません");
        setTeam(teamData);

        // メンバー情報を取得
        const { data: membersData, error: membersError } = await getTeamMembers(teamId);
        if (membersError) throw membersError;
        setMembers(membersData);

        // ポケモンデータを取得
        const pokemonData = await getAllPokemon();
        setAllPokemon(pokemonData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  // データ読み込み後にスカウト候補を生成
  useEffect(() => {
    if (!isLoading && allPokemon.length > 0) {
      generateCandidates();
    }
  }, [isLoading, allPokemon, generateCandidates]);

  // 候補を更新（評判を消費）
  const handleRefreshCandidates = async () => {
    if (!team || team.reputation < REPUTATION_POINTS.SCOUT_REFRESH_COST) {
      setMessage({ type: "error", text: "評判ポイントが足りません" });
      return;
    }

    setIsRefreshing(true);
    try {
      // 評判を減らす
      const { data: updatedTeam, error } = await updateTeamReputation(
        teamId,
        -REPUTATION_POINTS.SCOUT_REFRESH_COST
      );
      if (error) throw error;
      if (updatedTeam) {
        setTeam(updatedTeam);
      }

      // 新しい候補を生成
      generateCandidates();
      setMessage({ type: "success", text: "候補を更新しました" });
    } catch (err) {
      console.error("Failed to refresh candidates:", err);
      setMessage({ type: "error", text: "候補の更新に失敗しました" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // スカウト実行
  const handleScout = async (candidate: ScoutCandidate) => {
    if (!canScout) {
      setMessage({ type: "error", text: "部員数が上限に達しています" });
      return;
    }

    setIsScouting(true);
    try {
      // メンバーを追加
      const { data: newMembers, error } = await addTeamMembers(teamId, [
        {
          pokemonId: candidate.pokemon.id,
          position: candidate.bestPosition,
          isStarter: false,
          grade: 1,
        },
      ]);
      if (error) throw error;

      // メンバーリストを更新
      setMembers((prev) => [...prev, ...newMembers]);

      // 候補リストから削除
      setCandidates((prev) => prev.filter((c) => c.pokemon.id !== candidate.pokemon.id));

      setMessage({
        type: "success",
        text: `${candidate.pokemon.nameJa || candidate.pokemon.name}がチームに加入しました！`,
      });
    } catch (err) {
      console.error("Failed to scout:", err);
      setMessage({ type: "error", text: "スカウトに失敗しました" });
    } finally {
      setIsScouting(false);
    }
  };

  // メッセージを自動的に消す
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">チームが見つかりません</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const reputationRank = getReputationRank(team.reputation);
  const reputationStars = getReputationStars(team.reputation);
  const pointsToNext = getPointsToNextRank(team.reputation);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/team/${teamId}`}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-800">スカウト</h1>
            <p className="text-sm text-gray-500">{team.team_name}</p>
          </div>
        </div>

        {/* 評判・部員数ステータス */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* 評判 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">評判</p>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(reputationStars)}
                  {"☆".repeat(5 - reputationStars)}
                </span>
                <span className="font-bold text-gray-800">{team.reputation}pt</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                {reputationRank}
              </span>
              {pointsToNext !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  次のランクまで: {pointsToNext}pt
                </p>
              )}
            </div>
          </div>

          {/* 部員数 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">1年生部員数</p>
              <p className="font-bold text-gray-800">
                {firstYearCount}/{memberLimit}人
              </p>
            </div>
            <div>
              {canScout ? (
                <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                  スカウト可能
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-500">
                  上限に達しています
                </span>
              )}
            </div>
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* スカウト候補 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">スカウト候補</h2>
            <button
              type="button"
              onClick={handleRefreshCandidates}
              disabled={isRefreshing || team.reputation < REPUTATION_POINTS.SCOUT_REFRESH_COST}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>候補を更新</span>
              <span className="text-xs text-gray-500">(-{REPUTATION_POINTS.SCOUT_REFRESH_COST}pt)</span>
            </button>
          </div>

          {candidates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">候補がいません</p>
              <button
                type="button"
                onClick={generateCandidates}
                className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                候補を生成
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.pokemon.id}
                  candidate={candidate}
                  onScout={() => handleScout(candidate)}
                  disabled={!canScout || isScouting}
                />
              ))}
            </div>
          )}
        </div>

        {/* 評判の上げ方 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-700 mb-2">評判の上げ方</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span>試合に勝利: +{REPUTATION_POINTS.WIN}pt</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">●</span>
              <span>試合に参加: +{REPUTATION_POINTS.LOSS}pt</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// スカウト候補カード
function CandidateCard({
  candidate,
  onScout,
  disabled,
}: {
  candidate: ScoutCandidate;
  onScout: () => void;
  disabled: boolean;
}) {
  const { pokemon, bestPosition, positionFitness } = candidate;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-4">
        {/* ポケモン画像 */}
        <div className="w-16 h-16 relative flex-shrink-0">
          {pokemon.sprites.frontDefault && (
            <Image
              src={pokemon.sprites.frontDefault}
              alt={pokemon.nameJa || pokemon.name}
              fill
              sizes="64px"
              className="object-contain"
            />
          )}
        </div>

        {/* 情報 */}
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-gray-800 truncate">
            {pokemon.nameJa || pokemon.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
              {POSITION_NAMES_JA[bestPosition as Position]}
            </span>
            <span className="text-yellow-500 text-sm">
              {"★".repeat(positionFitness.stars)}
              {"☆".repeat(5 - positionFitness.stars)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            適性スコア: {positionFitness.score}
          </p>
        </div>

        {/* スカウトボタン */}
        <button
          type="button"
          onClick={onScout}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          スカウト
        </button>
      </div>
    </div>
  );
}
