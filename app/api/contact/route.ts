import { getSessionUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const { category, message, reply_email } = await request.json()

  if (!category || !message?.trim()) {
    return NextResponse.json({ error: '内容を入力してください' }, { status: 400 })
  }

  // ユーザー名を自動取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    email: user.email,
    nickname: profile?.nickname ?? null,
    reply_email: reply_email || null,
    category,
    message: message.trim(),
  })

  if (error) {
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
