import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // セッションからユーザーを取得
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // リクエストユーザーが管理者か確認
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // リクエストボディを取得
    const body = await request.json()
    const { userId, reason } = body as { userId: string; reason: string | null }

    if (!userId) {
      return NextResponse.json({ error: 'userId は必須です' }, { status: 400 })
    }

    // 自分自身をBANできないようにする
    if (userId === user.id) {
      return NextResponse.json({ error: '自分自身をBANすることはできません' }, { status: 400 })
    }

    if (reason === null) {
      // BAN解除
      const { error } = await supabase
        .from('profiles')
        .update({ banned_at: null, ban_reason: null })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: 'BAN解除に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'unbanned' })
    } else {
      // BAN実行
      const { error } = await supabase
        .from('profiles')
        .update({ banned_at: new Date().toISOString(), ban_reason: reason })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: 'BANに失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'banned' })
    }
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
