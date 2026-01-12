import { supabase } from './client';

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

  // usersテーブルにプロフィールを作成
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      display_name: displayName || null,
    });

    if (profileError) throw profileError;
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
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * ユーザープロフィールを更新
 */
export async function updateUserProfile(
  userId: string,
  updates: { display_name?: string }
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
