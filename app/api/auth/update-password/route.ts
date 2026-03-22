import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = rateLimit(`auth-pw:${user.id}`, 3, 60_000)
  if (limited) return limited

  const { password } = await req.json()
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 })
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
