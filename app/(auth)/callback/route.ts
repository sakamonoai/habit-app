import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth コールバックハンドラ
 *
 * Supabase ダッシュボードの Authentication > URL Configuration で
 * Site URL と Redirect URLs に以下を追加してください:
 *   - http://localhost:3000/callback (開発環境)
 *   - https://your-domain.com/callback (本番環境)
 *
 * Apple Sign In を使う場合は Apple Developer Program への登録と
 * Services ID の設定が別途必要です。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/challenges'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
