import { createClient } from '@supabase/supabase-js'

/** RLSバイパス用の管理者クライアント（サーバーサイド専用） */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase環境変数が設定されていません')
  }
  return createClient(url, serviceRoleKey)
}
