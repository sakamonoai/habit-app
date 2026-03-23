import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// サーバーサイドではWebSocketが使えないため、ダミーのtransportを提供
class NoopWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3
  readyState = 3
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: (() => void) | null = null
  onerror: (() => void) | null = null
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false }
  get binaryType(): BinaryType { return 'blob' }
  set binaryType(_v: BinaryType) {}
  get bufferedAmount() { return 0 }
  get extensions() { return '' }
  get protocol() { return '' }
  get url() { return '' }
  get CONNECTING() { return 0 }
  get OPEN() { return 1 }
  get CLOSING() { return 2 }
  get CLOSED() { return 3 }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
      realtime: {
        transport: NoopWebSocket as unknown as typeof WebSocket,
      },
    }
  )
}

/** セッションからユーザーIDを高速取得（JWTローカル検証のみ、API往復なし） */
export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, user: session?.user ?? null }
}
