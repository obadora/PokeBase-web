"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { updateUserProfile, signOut } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

/**
 * プロフィール編集画面
 */
export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [userRole, setUserRole] = useState<string>("user");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // ユーザー情報を取得
      supabase
        .from("users")
        .select("display_name, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name || "");
            setUserRole(data.role || "user");
          }
        });
    }
  }, [user, loading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    setMessage("");

    try {
      await updateUserProfile(user.id, { display_name: displayName });
      setMessage("プロフィールを更新しました");
    } catch (err) {
      setMessage("更新に失敗しました: " + (err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚾ プロフィール</h1>
          <p className="text-gray-600">アカウント情報の確認と編集</p>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* メッセージ */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("失敗") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* 表示名 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* メールアドレス（読み取り専用） */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-600"
              />
              <p className="text-sm text-gray-500 mt-1">メールアドレスは変更できません</p>
            </div>

            {/* ユーザーID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ユーザーID</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-600">
                {user.id}
              </div>
            </div>

            {/* 権限バッジ */}
            {userRole === "admin" && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="font-bold text-purple-800">管理者権限</p>
                    <p className="text-sm text-purple-600">管理者機能にアクセスできます</p>
                  </div>
                </div>
              </div>
            )}

            {/* 更新ボタン */}
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50"
            >
              {updating ? "更新中..." : "更新"}
            </button>
          </form>
        </div>

        {/* 管理者ページリンク */}
        {userRole === "admin" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">👑 管理者メニュー</h2>
            <Link
              href="/admin"
              className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg text-center shadow-lg transition-all"
            >
              管理者ページへ
            </Link>
          </div>
        )}

        {/* ログアウトボタン */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
          >
            ログアウト
          </button>
        </div>

        {/* ホームに戻る */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 hover:underline font-semibold"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
