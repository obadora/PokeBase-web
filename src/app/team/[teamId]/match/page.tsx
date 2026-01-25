/**
 * 試合シミュレーションページ
 * チームの試合をシミュレートして結果を表示
 */

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { Pokemon } from "@/types";
import type { Team, TeamMemberWithPokemon } from "@/types/team";
import type { MatchResult, OpponentTeam } from "@/types/match";
import { REPUTATION_POINTS } from "@/types/reputation";
import { getTeamById, getTeamMembers, updateTeamReputation } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { simulateMatch, calculateTeamPower } from "@/lib/simulator/match";
import { generateRandomOpponent } from "@/lib/simulator/opponent";
import { MatchResultDisplay } from "@/components/match/MatchResult";
import { MatchProgress } from "@/components/match/MatchProgress";
import { getOrCreatePracticeMatch, saveMatchResult } from "@/lib/supabase/match";

type MatchState = "idle" | "preparing" | "playing" | "result";

interface MatchPageProps {
  params: Promise<{ teamId: string }>;
}

export default function MatchPage({ params }: MatchPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithPokemon[]>([]);
  const [opponent, setOpponent] = useState<OpponentTeam | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [reputationChange, setReputationChange] = useState(0);
  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);

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
        const { data: memberData, error: memberError } = await getTeamMembers(teamId);
        if (memberError) throw memberError;

        // ポケモンデータを取得
        const pokemonData = await getAllPokemon();
        setAllPokemon(pokemonData);
        const pokemonMap = new Map<number, Pokemon>();
        pokemonData.forEach((p) => pokemonMap.set(p.id, p));

        const membersWithPokemon: TeamMemberWithPokemon[] = [];
        for (const member of memberData) {
          const pokemon = pokemonMap.get(member.pokemon_id);
          if (pokemon) {
            membersWithPokemon.push({ ...member, pokemon });
          }
        }
        setMembers(membersWithPokemon);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  // 試合準備
  const handlePrepareMatch = () => {
    if (!team || members.length === 0 || allPokemon.length === 0) return;

    const starters = members.filter((m) => m.is_starter);
    if (starters.length < 9) {
      setError("スタメンが9人揃っていません。編成画面でスタメンを設定してください。");
      return;
    }

    const teamPower = calculateTeamPower(members);
    const newOpponent = generateRandomOpponent(teamPower.total, allPokemon);
    setOpponent(newOpponent);
    setMatchState("preparing");
    setError(null);
  };

  // 試合開始
  const handleStartMatch = () => {
    if (!team || !opponent) return;

    // シミュレーション結果を先に計算
    const result = simulateMatch(members, team.team_name, opponent);
    setMatchResult(result);

    // 評判ポイント計算
    const points = result.winner === "A" ? REPUTATION_POINTS.WIN : REPUTATION_POINTS.LOSS;
    setReputationChange(points);

    // 試合進行表示へ
    setMatchState("playing");
  };

  // 試合進行完了時の処理
  const handleMatchProgressComplete = async () => {
    if (!team || !opponent || !matchResult) return;

    // DB保存
    try {
      // 評判ポイント更新
      await updateTeamReputation(teamId, reputationChange);
      setTeam((prev) =>
        prev ? { ...prev, reputation: prev.reputation + reputationChange } : null
      );

      // 試合結果保存
      const { data: tournament } = await getOrCreatePracticeMatch(teamId);
      if (tournament) {
        const score = `${matchResult.teamAScore}-${matchResult.teamBScore}`;
        await saveMatchResult(
          tournament.id,
          opponent.name,
          matchResult.winner === "A" ? "win" : "lose",
          score
        );
      }
    } catch (err) {
      console.error("Failed to save match result:", err);
    }

    setMatchState("result");
  };

  // 次の試合
  const handleNextMatch = () => {
    setMatchResult(null);
    setOpponent(null);
    setMatchState("idle");
  };

  // 戻る
  const handleClose = () => {
    setMatchResult(null);
    setOpponent(null);
    setMatchState("idle");
  };

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

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">チームが見つかりません</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const teamPower = calculateTeamPower(members);
  const starters = members.filter((m) => m.is_starter);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/team/${teamId}`}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">試合</h1>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            {starters.length < 9 && (
              <Link
                href={`/team/${teamId}/formation`}
                className="inline-block mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                編成画面へ
              </Link>
            )}
          </div>
        )}

        {/* 試合状態に応じた表示 */}
        {matchState === "idle" && (
          <>
            {/* チーム戦力表示 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">{team.team_name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">総合戦力</p>
                  <p className="text-2xl font-bold text-green-600">{teamPower.total}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">スタメン</p>
                  <p className="text-2xl font-bold text-gray-800">{starters.length}/9</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-xs text-gray-500">攻撃力</p>
                  <p className="font-bold text-red-600">{teamPower.offense}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-xs text-gray-500">守備力</p>
                  <p className="font-bold text-blue-600">{teamPower.defense}</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <p className="text-xs text-gray-500">投手力</p>
                  <p className="font-bold text-purple-600">{teamPower.pitching}</p>
                </div>
              </div>
            </div>

            {/* 試合開始ボタン */}
            <button
              onClick={handlePrepareMatch}
              disabled={starters.length < 9}
              className={`w-full py-4 text-lg font-bold rounded-lg transition-colors ${
                starters.length < 9
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              練習試合を始める
            </button>
            {starters.length < 9 && (
              <p className="text-center text-sm text-red-500 mt-2">スタメンが9人揃っていません</p>
            )}
          </>
        )}

        {matchState === "preparing" && opponent && (
          <>
            {/* 対戦カード */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-center text-lg font-bold text-gray-800 mb-6">対戦カード</h2>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">&#9918;</div>
                  <p className="font-bold text-gray-800">{team.team_name}</p>
                  <p className="text-sm text-gray-500">戦力: {teamPower.total}</p>
                </div>
                <div className="text-2xl font-bold text-gray-400">VS</div>
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">&#9918;</div>
                  <p className="font-bold text-gray-800">{opponent.name}</p>
                  <p className="text-sm text-gray-500">戦力: {opponent.power}</p>
                </div>
              </div>
            </div>

            {/* 試合開始ボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleStartMatch}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                試合開始!
              </button>
            </div>
          </>
        )}

        {matchState === "playing" && matchResult && opponent && (
          <MatchProgress
            teamAName={team.team_name}
            teamBName={opponent.name}
            result={matchResult}
            onComplete={handleMatchProgressComplete}
          />
        )}

        {matchState === "result" && matchResult && opponent && (
          <MatchResultDisplay
            teamAName={team.team_name}
            teamBName={opponent.name}
            result={matchResult}
            reputationChange={reputationChange}
            onClose={handleClose}
            onNextMatch={handleNextMatch}
          />
        )}
      </div>
    </div>
  );
}
