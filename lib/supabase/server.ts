import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // サーバーサイドではWebSocketが使えないため、realtime接続を完全に無効化
  // transport オプションが効かないケースがあるため、connect自体を上書き
  client.realtime.connect = () => {}
  client.realtime.disconnect = () => {}

  return client
}

/** セッションからユーザーIDを高速取得（JWTローカル検証のみ、API往復なし） */
export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, user: session?.user ?? null }
}
