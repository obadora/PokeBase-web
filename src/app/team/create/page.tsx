/**
 * チーム作成ページ
 * 1年生6人を選択してチームを作成する
 * 2・3年生はランダム生成
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import type { MemberSlotState, TeamValidationResult, Grade } from "@/types/team";
import { POSITION_CATEGORIES, DEFAULT_TEAM_RULES } from "@/types/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { createTeam, addTeamMembers } from "@/lib/supabase/team";
import { useAuthStore } from "@/store/auth";
import { MemberSelectionPanel } from "@/components/team/MemberSelectionPanel";
import { SeniorMembersDisplay } from "@/components/team/SeniorMembersDisplay";
import {
  initializeTeamMembers,
  generateRandomFirstYearMembers,
  getUsedPokemonIds,
  generateRandomGradeMembers,
} from "@/lib/utils/team-builder";

// チーム構成のバリデーション
function validateTeam(members: MemberSlotState[]): TeamValidationResult {
  const errors: string[] = [];

  // 投手チェック
  const pitcher = members.find((m) => m.position === "pitcher");
  if (!pitcher?.pokemon) {
    errors.push("投手を選択してください");
  }

  // 捕手チェック
  const catcher = members.find((m) => m.position === "catcher");
  if (!catcher?.pokemon) {
    errors.push("捕手を選択してください");
  }

  // 内野手チェック
  const infieldCount = members.filter(
    (m) => POSITION_CATEGORIES.infield.includes(m.position) && m.pokemon
  ).length;
  if (infieldCount < DEFAULT_TEAM_RULES.infield.min) {
    errors.push(
      `内野手は${DEFAULT_TEAM_RULES.infield.min}人以上選択してください（現在: ${infieldCount}人）`
    );
  }
  if (infieldCount > DEFAULT_TEAM_RULES.infield.max) {
    errors.push(
      `内野手は${DEFAULT_TEAM_RULES.infield.max}人以下で選択してください（現在: ${infieldCount}人）`
    );
  }

  // 外野手チェック
  const outfieldCount = members.filter(
    (m) => POSITION_CATEGORIES.outfield.includes(m.position) && m.pokemon
  ).length;
  if (outfieldCount < DEFAULT_TEAM_RULES.outfield.min) {
    errors.push(
      `外野手は${DEFAULT_TEAM_RULES.outfield.min}人以上選択してください（現在: ${outfieldCount}人）`
    );
  }
  if (outfieldCount > DEFAULT_TEAM_RULES.outfield.max) {
    errors.push(
      `外野手は${DEFAULT_TEAM_RULES.outfield.max}人以下で選択してください（現在: ${outfieldCount}人）`
    );
  }

  // 合計人数チェック
  const totalCount = members.filter((m) => m.pokemon).length;
  if (totalCount !== DEFAULT_TEAM_RULES.maxMembers) {
    errors.push(
      `合計${DEFAULT_TEAM_RULES.maxMembers}人を選択してください（現在: ${totalCount}人）`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/** 学年別メンバー状態 */
interface GradeMembers {
  firstYear: MemberSlotState[];
  secondYear: MemberSlotState[];
  thirdYear: MemberSlotState[];
}

export default function TeamCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [gradeMembers, setGradeMembers] = useState<GradeMembers>({
    firstYear: [],
    secondYear: [],
    thirdYear: [],
  });
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ポケモンデータを取得し、2・3年生をランダム生成
  useEffect(() => {
    async function loadPokemonAndInitialize() {
      try {
        const pokemon = await getAllPokemon();
        setPokemonList(pokemon);

        // 2・3年生をランダム生成、1年生は空スロット
        const initialMembers = initializeTeamMembers(pokemon);
        setGradeMembers(initialMembers);
      } catch (err) {
        console.error("Failed to load Pokemon:", err);
        setError("ポケモンデータの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }
    loadPokemonAndInitialize();
  }, []);

  // 1年生メンバー変更ハンドラー
  const handleFirstYearMemberChange = (position: Position, pokemon: Pokemon | null) => {
    setGradeMembers((prev) => ({
      ...prev,
      firstYear: prev.firstYear.map((m) => (m.position === position ? { ...m, pokemon } : m)),
    }));
  };

  // 1年生一括ランダム生成
  const handleRandomizeFirstYear = () => {
    const seniorIds = [
      ...getUsedPokemonIds(gradeMembers.secondYear),
      ...getUsedPokemonIds(gradeMembers.thirdYear),
    ];
    const newFirstYear = generateRandomFirstYearMembers(pokemonList, seniorIds);
    setGradeMembers((prev) => ({
      ...prev,
      firstYear: newFirstYear,
    }));
  };

  // 上級生再生成ハンドラー
  const handleRegenerateSeniors = (grade: Grade) => {
    const otherGradeIds =
      grade === 3
        ? [
            ...getUsedPokemonIds(gradeMembers.firstYear),
            ...getUsedPokemonIds(gradeMembers.secondYear),
          ]
        : [
            ...getUsedPokemonIds(gradeMembers.firstYear),
            ...getUsedPokemonIds(gradeMembers.thirdYear),
          ];

    const newMembers = generateRandomGradeMembers(pokemonList, otherGradeIds);

    setGradeMembers((prev) => ({
      ...prev,
      [grade === 3 ? "thirdYear" : "secondYear"]: newMembers,
    }));
  };

  // チーム作成ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // チーム名のバリデーション
    if (!teamName.trim()) {
      setError("チーム名を入力してください");
      return;
    }
    if (teamName.length > 50) {
      setError("チーム名は50文字以内で入力してください");
      return;
    }

    // ユーザー認証チェック
    if (!user) {
      setError("チームを作成するにはログインが必要です");
      return;
    }

    // 1年生メンバー構成のバリデーション
    const validation = validateTeam(gradeMembers.firstYear);
    if (!validation.isValid) {
      setError(validation.errors.join("\n"));
      return;
    }

    setIsSubmitting(true);

    try {
      // チームを作成
      const { data: team, error: teamError } = await createTeam(user.id, teamName.trim());
      if (teamError || !team) {
        throw teamError || new Error("チームの作成に失敗しました");
      }

      // 全学年のメンバーを追加
      const allMemberData: {
        pokemonId: number;
        position: string;
        isStarter: boolean;
        grade: Grade;
      }[] = [];

      // 1年生
      gradeMembers.firstYear
        .filter((m) => m.pokemon)
        .forEach((m) => {
          allMemberData.push({
            pokemonId: m.pokemon!.id,
            position: m.position,
            isStarter: true,
            grade: 1,
          });
        });

      // 2年生
      gradeMembers.secondYear
        .filter((m) => m.pokemon)
        .forEach((m) => {
          allMemberData.push({
            pokemonId: m.pokemon!.id,
            position: m.position,
            isStarter: true,
            grade: 2,
          });
        });

      // 3年生
      gradeMembers.thirdYear
        .filter((m) => m.pokemon)
        .forEach((m) => {
          allMemberData.push({
            pokemonId: m.pokemon!.id,
            position: m.position,
            isStarter: true,
            grade: 3,
          });
        });

      const { error: membersError } = await addTeamMembers(team.id, allMemberData);
      if (membersError) {
        throw membersError;
      }

      // チーム詳細ページへ遷移
      router.push(`/team/${team.id}`);
    } catch (err) {
      console.error("Failed to create team:", err);
      setError(err instanceof Error ? err.message : "チームの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors">
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
          <h1 className="text-2xl font-bold text-gray-800">チーム作成</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* チーム名入力 */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <label htmlFor="teamName" className="block text-sm font-semibold text-gray-700 mb-2">
              チーム名
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="チーム名を入力（1〜50文字）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={50}
            />
          </div>

          {/* 上級生（3年生・2年生）表示セクション */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">上級生メンバー</h2>
            <p className="text-sm text-gray-500 mb-4">
              2・3年生はランダムで生成されます。再生成ボタンで変更できます。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 3年生 */}
              <div className="relative">
                <SeniorMembersDisplay grade={3} members={gradeMembers.thirdYear} />
                <button
                  type="button"
                  onClick={() => handleRegenerateSeniors(3)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="3年生を再生成"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              {/* 2年生 */}
              <div className="relative">
                <SeniorMembersDisplay grade={2} members={gradeMembers.secondYear} />
                <button
                  type="button"
                  onClick={() => handleRegenerateSeniors(2)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="2年生を再生成"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 1年生選択セクション */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">1年生メンバー（新入生）</h2>
                <p className="text-sm text-gray-500">
                  6人を選択してください。ポジション適性のあるポケモンのみ選択可能です。
                </p>
              </div>
              <button
                type="button"
                onClick={handleRandomizeFirstYear}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                一括ランダム
              </button>
            </div>
            <MemberSelectionPanel
              pokemonList={pokemonList}
              members={gradeMembers.firstYear}
              onMemberChange={handleFirstYearMemberChange}
              excludePokemonIds={[
                ...getUsedPokemonIds(gradeMembers.secondYear),
                ...getUsedPokemonIds(gradeMembers.thirdYear),
              ]}
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !user}
              className={`
                w-full py-4 rounded-lg font-bold text-lg transition-colors
                ${
                  isSubmitting || !user
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }
              `}
            >
              {isSubmitting ? "作成中..." : "チームを作成する（18人）"}
            </button>
            {!user && (
              <p className="mt-2 text-center text-sm text-gray-500">
                チームを作成するには
                <Link href="/login" className="text-green-600 hover:underline">
                  ログイン
                </Link>
                が必要です
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
