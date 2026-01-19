import { supabase } from "./client";

/**
 * public.usersテーブルにユーザーが存在しなければ作成
 */
async function ensureUserExists(userId: string, email: string, displayName?: string | null) {
  // 既存ユーザーを確認
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (existingUser) {
    return; // 既に存在する
  }

  // ユーザーを作成
  const { error } = await supabase.from("users").insert({
    id: userId,
    email: email,
    display_name: displayName || null,
  });

  if (error) {
    console.error("Failed to create user in public.users:", error);
    // エラーが発生しても認証は成功しているので、throwしない
  }
}

/**
 * メールアドレスとパスワードでサインアップ
 */
export async function signUp(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) throw error;

  // public.usersテーブルにユーザーを作成
  if (data.user) {
    await ensureUserExists(data.user.id, email, displayName);
  }

  return data;
}

/**
 * メールアドレスとパスワードでログイン
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // public.usersテーブルにユーザーが存在しなければ作成
  if (data.user) {
    await ensureUserExists(data.user.id, data.user.email || email);
  }

  return data;
}

/**
 * ログアウト
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * ユーザープロフィールを取得
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) throw error;
  return data;
}

/**
 * ユーザープロフィールを更新
 */
export async function updateUserProfile(userId: string, updates: { display_name?: string }) {
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}
