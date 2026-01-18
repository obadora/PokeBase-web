import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server ComponentsやServer Actionsで使用するSupabaseクライアント
 * Cookie経由でセッション管理を行う
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}
