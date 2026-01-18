import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware: 全リクエストで認証状態をチェックし、ルートガードを実装
 * - 公開ルート: /, /login, /signup
 * - 保護ルート: その他すべて（認証必須）
 * - 管理者ルート: /admin（role=admin必須）
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // ログイン済みユーザーが認証ページにアクセス → プロフィールへ
  if (
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup') &&
    user
  ) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // 未認証ユーザーが保護ルートにアクセス → ログインへ
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 管理者ページへのアクセスチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのルートにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像ファイル (.svg, .png, .jpg等)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
