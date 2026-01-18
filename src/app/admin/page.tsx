"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/lib/supabase/client";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

/**
 * 管理者ページ
 * role=adminのユーザーのみアクセス可能
 */
export default function AdminPage() {
  const { user, loading } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [userRole, setUserRole] = useState<string>("user");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // 現在のユーザーのroleを取得
      supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role !== "admin") {
            router.push("/");
          } else {
            setUserRole(data.role);
            fetchUsers();
          }
        });
    } else if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
    }
    if (error) {
      console.error("Error fetching users:", error);
    }
    setLoadingUsers(false);
  };

  if (loading || userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span>👑</span>
            <span>管理者ページ</span>
          </h1>
          <p className="text-gray-600">ユーザー管理とシステム設定</p>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
            <span>登録ユーザー一覧</span>
            <span className="text-lg font-normal text-gray-600">{users.length}名</span>
          </h2>

          {loadingUsers ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">表示名</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      メールアドレス
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">権限</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{userData.display_name || "未設定"}</td>
                      <td className="py-3 px-4 font-mono text-sm">{userData.email}</td>
                      <td className="py-3 px-4">
                        {userData.role === "admin" ? (
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            👑 管理者
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                            一般ユーザー
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(userData.created_at).toLocaleDateString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/profile"
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
          >
            ← プロフィールに戻る
          </Link>
          <Link
            href="/"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
