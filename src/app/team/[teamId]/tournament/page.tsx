/**
 * 大会ページ
 * トーナメント生成と対戦、結果表示
 */

"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import type { Pokemon } from "@/types";
import type { Team, TeamMemberWithPokemon } from "@/types/team";
import type {
  TournamentType,
  TournamentMatch,
  OpponentTeam,
  OpponentMember,
} from "@/types/opponent";
import {
  TOURNAMENT_TYPE_NAMES_JA,
  TOURNAMENT_CONFIGS,
  TOURNAMENT_REWARDS,
  TOURNAMENT_REQUIREMENTS,
} from "@/types/opponent";
import type { MatchResult, OpponentMember as MatchOpponentMember } from "@/types/match";
import { getTeamById, getTeamMembers, updateTeamReputation } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import {
  generateTournamentBracket,
  getNextPlayerMatch,
  getPlayerOpponent,
  isTournamentComplete,
  didPlayerWin,
} from "@/lib/services/tournament";
import { simulateMatch, calculateTeamPower } from "@/lib/simulator/match";
import { TournamentBracketDisplay } from "@/components/tournament/TournamentBracket";
import { MatchPreview } from "@/components/tournament/MatchPreview";
import { OpponentTeamDetail } from "@/components/tournament/OpponentTeamDetail";
import { MatchResultDisplay } from "@/components/match/MatchResult";
import { MatchProgress } from "@/components/match/MatchProgress";
import { useTournamentStore } from "@/store/tournament";

type PageState =
  | "select"
  | "tournament"
  | "opponent-detail"
  | "playing"
  | "result"
  | "tournament-complete";

interface TournamentPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TournamentPage({ params }: TournamentPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // ページ状態
  const [pageState, setPageState] = useState<PageState>("select");
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentTeam | null>(null);

  // 試合結果
  const [currentMatchResult, setCurrentMatchResult] = useState<MatchResult | null>(null);
  const [currentOpponent, setCurrentOpponent] = useState<OpponentTeam | null>(null);
  const [reputationChange, setReputationChange] = useState(0);

  // トーナメントストア
  const {
    currentBracket,
    status,
    matchRecords,
    tournamentHistory,
    startTournament,
    recordMatchResult,
    completeTournament,
    clearCurrentTournament,
    unlockTournament,
    hasChampionship,
  } = useTournamentStore();

  // Zustand persistのハイドレーション
  useEffect(() => {
    useTournamentStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    if (!isHydrated) return;

    async function loadData() {
      try {
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) throw teamError;
        if (!teamData) throw new Error("チームが見つかりません");
        setTeam(teamData);

        const pokemon = await getAllPokemon();
        setAllPokemon(pokemon);

        // チームメンバー取得
        const { data: members, error: memberError } = await getTeamMembers(teamId);
        if (memberError) throw memberError;

        // ポケモンデータを結合
        const membersWithPokemon: TeamMemberWithPokemon[] = members.map((m) => ({
          ...m,
          pokemon: pokemon.find((p) => p.id === m.pokemon_id)!,
        }));
        setTeamMembers(membersWithPokemon);

        // 進行中のトーナメントがあればトーナメント画面へ
        if (status === "in_progress" && currentBracket) {
          setPageState("tournament");
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [teamId, status, currentBracket, isHydrated]);

  // 大会が解放されているか確認
  const isTournamentUnlocked = useCallback(
    (type: TournamentType): boolean => {
      if (!team) return false;
      const requirement = TOURNAMENT_REQUIREMENTS[type];

      // 評判ポイント条件
      if (team.reputation < requirement.minReputation) return false;

      // 過去の優勝条件
      if (requirement.requiredChampionship) {
        if (!hasChampionship(requirement.requiredChampionship)) return false;
      }

      return true;
    },
    [team, hasChampionship]
  );

  // 大会を開始
  const handleStartTournament = (type: TournamentType) => {
    const newBracket = generateTournamentBracket(allPokemon, type);
    startTournament(newBracket, teamId);
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

  // 試合開始
  const handleStartMatch = () => {
    if (!currentBracket || !team) return;

    const nextMatch = getNextPlayerMatch(currentBracket);
    if (!nextMatch) return;

    const opponent = getPlayerOpponent(nextMatch);
    if (!opponent) return;

    // 対戦相手を保存
    setCurrentOpponent(opponent);

    // OpponentMember を MatchOpponentMember に変換
    const convertedMembers: MatchOpponentMember[] = opponent.members.map(
      (m: OpponentMember) => ({
        name: m.pokemon.nameJa || m.pokemon.name,
        position: m.position,
        power: calculateMemberPower(m),
        pokemonId: m.pokemon.id,
        spriteUrl: m.pokemon.sprites.frontDefault,
      })
    );

    // 試合シミュレーション（先に計算）
    const result = simulateMatch(
      teamMembers,
      team.team_name,
      {
        name: opponent.name,
        power: opponent.averageStats,
        members: convertedMembers,
      }
    );

    setCurrentMatchResult(result);

    // 勝敗に応じた報酬計算
    const isWin = result.winner === "A";
    const rewards = TOURNAMENT_REWARDS[currentBracket.type];
    let reward = 0;

    if (isWin) {
      reward = rewards.winReward;
    }

    setReputationChange(reward);

    // ストアに結果を記録
    recordMatchResult(nextMatch.id, isWin, result);

    // イニング進行表示へ（resultではなくplaying）
    setPageState("playing");
  };

  // 試合進行完了時の処理
  const handleMatchProgressComplete = () => {
    setPageState("result");
  };

  // メンバーのパワーを計算
  const calculateMemberPower = (member: OpponentMember): number => {
    const stats = member.pokemon.stats;
    return Math.round(
      (stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed) / 6
    );
  };

  // 試合結果を閉じる
  const handleCloseResult = async () => {
    if (!currentBracket || !team) return;

    const isWin = currentMatchResult?.winner === "A";
    const rewards = TOURNAMENT_REWARDS[currentBracket.type];

    // 評判ポイントを更新
    if (reputationChange > 0) {
      await updateTeamReputation(teamId, reputationChange);
      setTeam((prev) => prev ? { ...prev, reputation: prev.reputation + reputationChange } : null);
    }

    // 敗北した場合
    if (!isWin) {
      // 参加報酬を付与
      const participationReward = rewards.participationReward;
      await updateTeamReputation(teamId, participationReward);

      const totalReward = matchRecords
        .filter((r) => r.result === "win")
        .length * rewards.winReward + participationReward;

      completeTournament(false, totalReward);
      setPageState("tournament-complete");
      return;
    }

    // トーナメント完了チェック
    if (isTournamentComplete(currentBracket) || didPlayerWin(currentBracket)) {
      // 優勝報酬を付与
      await updateTeamReputation(teamId, rewards.championReward);
      setTeam((prev) =>
        prev ? { ...prev, reputation: prev.reputation + rewards.championReward } : null
      );

      const totalReward =
        matchRecords.filter((r) => r.result === "win").length * rewards.winReward +
        rewards.winReward + // 決勝戦分
        rewards.championReward;

      completeTournament(true, totalReward);

      // 次の大会を解放
      if (currentBracket.type === "district") {
        unlockTournament("regional");
      } else if (currentBracket.type === "regional") {
        unlockTournament("national");
      }

      setPageState("tournament-complete");
      return;
    }

    // 次の試合へ
    setCurrentMatchResult(null);
    setCurrentOpponent(null);
    setReputationChange(0);
    setPageState("tournament");
  };

  // 次の試合へ
  const handleNextMatch = () => {
    handleCloseResult();
  };

  // トーナメント完了後、選択画面に戻る
  const handleReturnToSelect = () => {
    clearCurrentTournament();
    setCurrentMatchResult(null);
    setCurrentOpponent(null);
    setReputationChange(0);
    setPageState("select");
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

  // 試合中画面（イニング進行表示）
  if (pageState === "playing" && currentMatchResult && currentOpponent) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <MatchProgress
            teamAName={team.team_name}
            teamBName={currentOpponent.name}
            result={currentMatchResult}
            onComplete={handleMatchProgressComplete}
          />
        </div>
      </div>
    );
  }

  // 試合結果画面
  if (pageState === "result" && currentMatchResult && currentBracket && currentOpponent) {
    const isWin = currentMatchResult.winner === "A";
    const hasNextMatch = isWin && !isTournamentComplete(currentBracket) && !didPlayerWin(currentBracket);

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <MatchResultDisplay
            teamAName={team.team_name}
            teamBName={currentOpponent.name}
            result={currentMatchResult}
            reputationChange={reputationChange}
            onClose={handleCloseResult}
            onNextMatch={hasNextMatch ? handleNextMatch : undefined}
          />
        </div>
      </div>
    );
  }

  // トーナメント完了画面
  if (pageState === "tournament-complete" && currentBracket) {
    const isChampion = didPlayerWin(currentBracket);
    const wins = matchRecords.filter((r) => r.result === "win").length;
    const rewards = TOURNAMENT_REWARDS[currentBracket.type];
    const totalReward = isChampion
      ? wins * rewards.winReward + rewards.championReward
      : wins * rewards.winReward + rewards.participationReward;

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {isChampion ? (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-3xl font-bold text-yellow-600 mb-2">優勝！</h1>
                <p className="text-gray-600 mb-6">
                  {TOURNAMENT_TYPE_NAMES_JA[currentBracket.type]}を制覇しました！
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😢</div>
                <h1 className="text-3xl font-bold text-gray-600 mb-2">敗退</h1>
                <p className="text-gray-600 mb-6">
                  {TOURNAMENT_TYPE_NAMES_JA[currentBracket.type]}
                  {currentBracket.currentRound}回戦で敗退しました
                </p>
              </>
            )}

            {/* 成績 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">大会成績</h3>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-green-600">{wins}</p>
                  <p className="text-sm text-gray-500">勝利</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {matchRecords.filter((r) => r.result === "lose").length}
                  </p>
                  <p className="text-sm text-gray-500">敗北</p>
                </div>
              </div>
            </div>

            {/* 報酬 */}
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-yellow-700 mb-2">獲得報酬</h3>
              <p className="text-3xl font-bold text-yellow-600">+{totalReward}pt</p>
              <p className="text-sm text-yellow-600 mt-1">評判ポイント</p>
            </div>

            {/* 解放 */}
            {isChampion && currentBracket.type !== "national" && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-700">
                  🎉{" "}
                  {currentBracket.type === "district" ? "地方大会" : "全国大会"}
                  が解放されました！
                </p>
              </div>
            )}

            <button
              onClick={handleReturnToSelect}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              大会選択に戻る
            </button>
          </div>
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
              <p className="text-sm text-gray-500">
                {team.team_name} | 評判: {team.reputation}pt
              </p>
            </div>
          </div>

          {/* 大会種別選択 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700">大会を選択</h2>

            {(["district", "regional", "national"] as TournamentType[]).map((type) => {
              const config = TOURNAMENT_CONFIGS[type];
              const rewards = TOURNAMENT_REWARDS[type];
              const requirement = TOURNAMENT_REQUIREMENTS[type];
              const unlocked = isTournamentUnlocked(type);
              const hasWon = hasChampionship(type);

              return (
                <div
                  key={type}
                  className={`bg-white rounded-xl shadow-md p-6 ${
                    !unlocked ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {TOURNAMENT_TYPE_NAMES_JA[type]}
                      </h3>
                      {hasWon && (
                        <span className="text-yellow-500" title="優勝経験あり">
                          🏆
                        </span>
                      )}
                    </div>
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

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <p className="text-gray-500">試合数</p>
                      <p className="font-semibold">{Math.log2(config.teamCount)}試合</p>
                    </div>
                    <div>
                      <p className="text-gray-500">相手の強さ</p>
                      <p className="font-semibold">
                        平均{config.minAverageStats}〜{config.maxAverageStats}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">優勝報酬</p>
                      <p className="font-semibold text-yellow-600">
                        +{rewards.championReward}pt
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">勝利報酬</p>
                      <p className="font-semibold text-green-600">
                        +{rewards.winReward}pt/勝
                      </p>
                    </div>
                  </div>

                  {unlocked ? (
                    <button
                      onClick={() => handleStartTournament(type)}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        type === "district"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : type === "regional"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      参加する
                    </button>
                  ) : (
                    <div className="text-center py-3 bg-gray-100 rounded-lg text-gray-500">
                      <p className="font-semibold">🔒 未解放</p>
                      <p className="text-xs mt-1">
                        {requirement.requiredChampionship && (
                          <>
                            {TOURNAMENT_TYPE_NAMES_JA[requirement.requiredChampionship]}
                            優勝が必要
                          </>
                        )}
                        {requirement.minReputation > 0 && (
                          <> (評判{requirement.minReputation}pt以上)</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 過去の成績 */}
          {tournamentHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4">過去の成績</h2>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="space-y-2">
                  {tournamentHistory.slice(-5).reverse().map((history) => (
                    <div
                      key={history.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            history.isChampion
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {history.isChampion ? "🏆" : "−"}
                        </span>
                        <span className="font-medium">
                          {TOURNAMENT_TYPE_NAMES_JA[history.type]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {history.wins}勝{history.losses}敗 | +{history.rewardEarned}pt
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 対戦相手詳細画面
  if (pageState === "opponent-detail" && selectedOpponent && currentBracket) {
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
                {TOURNAMENT_TYPE_NAMES_JA[currentBracket.type]}
              </p>
            </div>
          </div>

          <OpponentTeamDetail team={selectedOpponent} onClose={closeOpponentDetail} />
        </div>
      </div>
    );
  }

  // トーナメント画面
  if ((pageState === "tournament" || status === "in_progress") && currentBracket) {
    const nextMatch = getNextPlayerMatch(currentBracket);
    const opponent = nextMatch ? getPlayerOpponent(nextMatch) : null;

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                if (confirm("大会を中断しますか？進行状況は失われます。")) {
                  clearCurrentTournament();
                  setPageState("select");
                }
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
                {TOURNAMENT_TYPE_NAMES_JA[currentBracket.type]}
              </h1>
              <p className="text-sm text-gray-500">
                {team.team_name} | {currentBracket.currentRound}回戦
              </p>
            </div>
          </div>

          {/* 進行状況 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {matchRecords.filter((r) => r.result === "win").length}
                  </p>
                  <p className="text-xs text-gray-500">勝利</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {matchRecords.filter((r) => r.result === "lose").length}
                  </p>
                  <p className="text-xs text-gray-500">敗北</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">チーム戦力</p>
                <p className="text-lg font-bold text-gray-700">
                  {calculateTeamPower(teamMembers).total}
                </p>
              </div>
            </div>
          </div>

          {/* 次の対戦プレビュー */}
          {nextMatch && opponent && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4">次の対戦</h2>
              <MatchPreview
                match={nextMatch}
                playerTeamName={team.team_name}
                onViewOpponent={() => viewOpponentDetail(opponent)}
                onStartMatch={handleStartMatch}
              />
            </div>
          )}

          {/* トーナメント表 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">トーナメント表</h2>
            <TournamentBracketDisplay
              bracket={currentBracket}
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
