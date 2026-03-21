import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const

export async function POST(request: Request) {
  try {
    // 認証チェック
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者チェック
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // リクエストボディの検証
    const body = await request.json()
    const { reportId, status, adminNote } = body

    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json(
        { error: '報告IDが必要です' },
        { status: 400 }
      )
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      )
    }

    // 報告レコードを更新
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status,
        admin_note: adminNote ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('報告の更新に失敗:', updateError)
      return NextResponse.json(
        { error: '更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('報告更新APIエラー:', err)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
