"use client";

import { useAuthStore } from "@/store/auth";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">PokeBase</h1>
        <p className="text-xl text-center">ポケモンの基地アプリへようこそ</p>

        {loading ? (
          <div>読み込み中...</div>
        ) : user ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
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
            <Link
              href="/pokemon-test"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
            >
              ポケモンテスト
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
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
            <Link
              href="/team/create"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
            >
              チーム作成（ログイン不要で閲覧）
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
