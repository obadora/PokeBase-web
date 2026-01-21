"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { getUserTeams } from "@/lib/supabase/team";
import type { Team } from "@/types/team";
import { getReputationRank, getReputationStars } from "@/types/reputation";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // ユーザーのチーム一覧を取得
  useEffect(() => {
    async function loadTeams() {
      if (!user) {
        setTeams([]);
        return;
      }

      setTeamsLoading(true);
      try {
        const { data, error } = await getUserTeams(user.id);
        if (!error) {
          setTeams(data);
        }
      } catch (err) {
        console.error("Failed to load teams:", err);
      } finally {
        setTeamsLoading(false);
      }
    }

    loadTeams();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">PokeBase</h1>
          <p className="text-gray-600 mt-2">ポケモンの基地アプリへようこそ</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* アクションボタン */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/profile"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
              >
                プロフィール
              </Link>
              <Link
                href="/team/create"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
              >
                チーム作成
              </Link>
            </div>

            {/* チーム一覧 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">マイチーム</h2>

              {teamsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">まだチームがありません</p>
                  <Link
                    href="/team/create"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    最初のチームを作成
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/team/${team.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{team.team_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-yellow-500 text-sm">
                              {"★".repeat(getReputationStars(team.reputation))}
                              {"☆".repeat(5 - getReputationStars(team.reputation))}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              {getReputationRank(team.reputation)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            作成日: {new Date(team.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* その他のリンク */}
            <div className="text-center">
              <Link
                href="/pokemon-test"
                className="text-blue-600 hover:underline text-sm"
              >
                ポケモンテスト
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 未ログイン時のアクションボタン */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
              >
                新規登録
              </Link>
            </div>

            {/* 案内 */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-600 mb-4">
                ログインするとチームを作成・管理できます
              </p>
              <Link
                href="/team/create"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                チーム作成を試す
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
