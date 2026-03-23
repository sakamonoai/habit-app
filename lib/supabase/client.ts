import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: { eventsPerSecond: 0 },
    },
  })
  // iOS Safari で WebSocket SecurityError が発生するため、Realtime を完全無効化
  client.realtime.connect = () => {}
  client.realtime.disconnect = () => {}
  return client
}
