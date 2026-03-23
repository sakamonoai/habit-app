import { requireAdmin } from '@/lib/admin-guard'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/** POST: 運営お知らせを全ユーザーに送信 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  const { title, body, url } = await req.json()
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 全アクティブユーザーを取得
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .is('banned_at', null)

  if (usersError) {
    return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ error: '送信先ユーザーが見つかりません' }, { status: 404 })
  }

  // 全ユーザーに通知を一括挿入
  const notifications = users.map((u) => ({
    user_id: u.id,
    title: title.trim(),
    body: body?.trim() || null,
    url: url?.trim() || null,
    type: 'announcement',
    read: false,
  }))

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications)

  if (insertError) {
    return NextResponse.json({ error: '通知の送信に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: users.length })
}
