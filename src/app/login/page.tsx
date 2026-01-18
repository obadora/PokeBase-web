"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/supabase/auth";

/**
 * ログイン画面
 * レトロ電光掲示板風デザイン
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push("/profile");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-mono font-bold text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] mb-2">
            POKEBASE
          </h1>
          <p className="text-amber-400 font-mono text-sm tracking-widest drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
            - LOGIN SYSTEM -
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-black border-4 border-amber-600 rounded-lg p-8 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-900 border-2 border-red-500 text-red-200 p-3 rounded text-sm font-mono">
                {error}
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="block text-amber-500 font-mono text-sm mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border-2 border-amber-600 text-amber-400 rounded px-4 py-3 font-mono focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                required
              />
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-amber-500 font-mono text-sm mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border-2 border-amber-600 text-amber-400 rounded px-4 py-3 font-mono focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                required
              />
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black font-mono font-bold py-3 rounded hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] transition-all"
            >
              {loading ? "LOADING..." : "⚾ START GAME"}
            </button>
          </form>

          {/* サインアップリンク */}
          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-amber-400 font-mono text-sm hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            >
              新規登録はこちら →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
