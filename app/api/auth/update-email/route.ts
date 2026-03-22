import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = rateLimit(`auth-email:${user.id}`, 3, 60_000)
  if (limited) return limited

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: '確認メールを送信しました。新しいメールアドレスのリンクをクリックしてください。' })
}
