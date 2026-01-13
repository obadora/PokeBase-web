import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// デバッグ用ログ
console.log('[Supabase Client] 環境変数の状態:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '未設定',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '未設定',
  urlType: typeof supabaseUrl,
  keyType: typeof supabaseAnonKey,
});

/**
 * Supabaseクライアント（クライアントサイド用）
 * 環境変数が設定されていない場合はエラーを投げる
 */
if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    'Supabaseの環境変数が設定されていません。\n' +
      'NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。\n' +
      `URL: ${supabaseUrl}\n` +
      `KEY: ${supabaseAnonKey ? 'あり(長さ: ' + supabaseAnonKey.length + ')' : 'なし'}`
  );
  console.error('[Supabase Client] エラー:', error);
  throw error;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
