'use client';

import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';

/**
 * Sprint 11: 環境構築の動作確認用ページ
 */
export default function TestAuthPage() {
  const { user, loading } = useAuthStore();

  const testConnection = async () => {
    try {
      console.log('[Test] Supabase接続テスト開始');
      const { data, error } = await supabase.from('users').select('count');
      console.log('[Test] レスポンス:', { data, error });
      if (error) throw error;
      alert('Supabase接続成功！\nusersテーブルにアクセスできました。');
    } catch (error) {
      const err = error as Error & {
        code?: string;
        details?: string;
        hint?: string;
      };
      console.error('[Test] 接続エラー詳細:', {
        error,
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack,
      });
      alert(
        '接続エラー:\n' +
          `メッセージ: ${err.message}\n` +
          `コード: ${err.code || 'なし'}\n` +
          `詳細: ${err.details || 'なし'}`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sprint 11: 環境構築テスト</h1>
          <p className="mt-2 text-gray-600">
            Supabase、Zustand、Framer Motionの動作確認
          </p>
        </div>

        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">認証状態</h2>
          <div className="space-y-2">
            <p>
              <strong>ログイン状態:</strong>{' '}
              {user ? 'ログイン済み' : '未ログイン'}
            </p>
            {user && (
              <>
                <p>
                  <strong>ユーザーID:</strong> {user.id}
                </p>
                <p>
                  <strong>メールアドレス:</strong> {user.email}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">接続テスト</h2>
          <button
            onClick={testConnection}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Supabase接続テスト
          </button>
        </div>

        <div className="rounded-lg border border-green-300 bg-green-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-green-800">
            ✅ 完了した項目
          </h2>
          <ul className="space-y-2 text-sm text-green-700">
            <li>✓ Supabaseプロジェクト作成</li>
            <li>✓ データベーステーブル作成</li>
            <li>✓ Supabaseクライアント設定</li>
            <li>✓ Zustand状態管理導入</li>
            <li>✓ Framer Motionインストール</li>
            <li>✓ 環境変数設定</li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-blue-600 hover:underline"
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
