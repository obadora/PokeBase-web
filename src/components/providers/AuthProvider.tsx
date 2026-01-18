"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

/**
 * 認証状態を監視し、Zustandストアに同期するプロバイダー
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 初期ユーザー状態を取得
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("認証エラー:", error);
        setLoading(false);
      });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
