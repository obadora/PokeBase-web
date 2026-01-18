"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/supabase/auth";

/**
 * サインアップ画面
 * 野球ユニフォーム風デザイン
 */
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signUp(email, password, displayName);
      router.push("/profile");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚾</div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">新規登録</h1>
          <p className="text-green-100">PokeBaseへようこそ！</p>
        </div>

        {/* フォーム（ユニフォーム風カード） */}
        <div className="bg-white rounded-lg shadow-2xl p-8 border-t-8 border-green-500">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                <p className="font-semibold">エラー</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* 表示名 */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <span>⚾</span>
                <span>プレイヤー名</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="山田太郎"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                required
                placeholder="your-email@example.com"
              />
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                required
                placeholder="8文字以上"
                minLength={8}
              />
              <p className="text-sm text-gray-500 mt-1">8文字以上で設定してください</p>
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "登録中..." : "⚾ チームに参加"}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-6 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              すでにアカウントをお持ちですか？{" "}
              <Link
                href="/login"
                className="text-green-600 font-semibold hover:text-green-700 hover:underline"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
