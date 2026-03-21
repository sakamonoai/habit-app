import { getSessionUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const { category, message } = await request.json()

  if (!category || !message?.trim()) {
    return NextResponse.json({ error: '内容を入力してください' }, { status: 400 })
  }

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    email: user.email,
    category,
    message: message.trim(),
  })

  if (error) {
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
