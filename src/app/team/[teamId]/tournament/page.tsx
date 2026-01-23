/**
 * 大会ページ
 * トーナメント生成と対戦相手表示
 */

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { Pokemon } from "@/types";
import type { Team } from "@/types/team";
import type { TournamentType, TournamentBracket, TournamentMatch, OpponentTeam } from "@/types/opponent";
import { TOURNAMENT_TYPE_NAMES_JA, TOURNAMENT_CONFIGS } from "@/types/opponent";
import { getTeamById } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { generateTournamentBracket, getNextPlayerMatch, getPlayerOpponent } from "@/lib/services/tournament";
import { TournamentBracketDisplay } from "@/components/tournament/TournamentBracket";
import { MatchPreview } from "@/components/tournament/MatchPreview";
import { OpponentTeamDetail } from "@/components/tournament/OpponentTeamDetail";

type PageState = "select" | "tournament" | "opponent-detail";

interface TournamentPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TournamentPage({ params }: TournamentPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // トーナメント状態
  const [pageState, setPageState] = useState<PageState>("select");
  const [selectedType, setSelectedType] = useState<TournamentType | null>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentTeam | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    async function loadData() {
      try {
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) throw teamError;
        if (!teamData) throw new Error("チームが見つかりません");
        setTeam(teamData);

        const pokemon = await getAllPokemon();
        setAllPokemon(pokemon);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  // 大会を開始
  const startTournament = (type: TournamentType) => {
    setSelectedType(type);
    const newBracket = generateTournamentBracket(allPokemon, type);
    setBracket(newBracket);
    setPageState("tournament");
  };

  // 対戦相手詳細を表示
  const viewOpponentDetail = (opponent: OpponentTeam) => {
    setSelectedOpponent(opponent);
    setPageState("opponent-detail");
  };

  // 対戦相手詳細を閉じる
  const closeOpponentDetail = () => {
    setSelectedOpponent(null);
    setPageState("tournament");
  };

  // 試合開始（今後の実装用）
  const handleStartMatch = () => {
    alert("試合機能は今後実装予定です");
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

  // 大会種別選択画面
  if (pageState === "select") {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-8">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-800">大会</h1>
              <p className="text-sm text-gray-500">{team.team_name}</p>
            </div>
          </div>

          {/* 大会種別選択 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700">大会を選択</h2>

            {(["district", "regional", "national"] as TournamentType[]).map((type) => {
              const config = TOURNAMENT_CONFIGS[type];
              return (
                <button
                  key={type}
                  onClick={() => startTournament(type)}
                  className="w-full bg-white rounded-xl shadow-md p-6 text-left hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      {TOURNAMENT_TYPE_NAMES_JA[type]}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        type === "district"
                          ? "bg-green-100 text-green-700"
                          : type === "regional"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {config.teamCount}チーム
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-gray-500">試合数</p>
                      <p className="font-semibold">{config.matchCount}試合</p>
                    </div>
                    <div>
                      <p className="text-gray-500">相手の強さ</p>
                      <p className="font-semibold">
                        平均{config.minAverageStats}〜{config.maxAverageStats}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">特徴</p>
                      <p className="font-semibold">
                        {config.useTypedTeam ? "タイプ統一チーム" : "バランス型強豪チーム"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 対戦相手詳細画面
  if (pageState === "opponent-detail" && selectedOpponent) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={closeOpponentDetail}
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
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">対戦相手情報</h1>
              <p className="text-sm text-gray-500">
                {selectedType && TOURNAMENT_TYPE_NAMES_JA[selectedType]}
              </p>
            </div>
          </div>

          <OpponentTeamDetail team={selectedOpponent} onClose={closeOpponentDetail} />
        </div>
      </div>
    );
  }

  // トーナメント画面
  if (pageState === "tournament" && bracket && selectedType) {
    const nextMatch = getNextPlayerMatch(bracket);
    const opponent = nextMatch ? getPlayerOpponent(nextMatch) : null;

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setPageState("select");
                setBracket(null);
                setSelectedType(null);
              }}
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
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {TOURNAMENT_TYPE_NAMES_JA[selectedType]}
              </h1>
              <p className="text-sm text-gray-500">{team.team_name}</p>
            </div>
          </div>

          {/* 次の対戦プレビュー */}
          {nextMatch && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4">次の対戦</h2>
              <MatchPreview
                match={nextMatch}
                playerTeamName={team.team_name}
                onViewOpponent={() => opponent && viewOpponentDetail(opponent)}
                onStartMatch={handleStartMatch}
              />
            </div>
          )}

          {/* トーナメント表 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">トーナメント表</h2>
            <TournamentBracketDisplay
              bracket={bracket}
              playerTeamName={team.team_name}
              onMatchClick={(match: TournamentMatch) => {
                const matchOpponent = match.team1 || match.team2;
                if (matchOpponent) {
                  viewOpponentDetail(matchOpponent);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
