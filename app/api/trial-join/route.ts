import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const limited = rateLimit(`trial-join:${user.id}`, 10, 60_000)
    if (limited) return limited

    const { challengeId } = (await req.json()) as { challengeId: string }

    if (!challengeId) {
      return NextResponse.json({ error: 'チャレンジIDが必要です' }, { status: 400 })
    }

    // チャレンジ存在確認
    const { data: challenge } = await supabase
      .from('challenges')
      .select('id, max_group_size, schedule_type, checkin_deadline')
      .eq('id', challengeId)
      .neq('status', 'suspended')
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'チャレンジが見つかりません' }, { status: 404 })
    }

    // グループを取得or作成
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('challenge_id', challengeId)
      .maybeSingle()

    let groupId = existingGroup?.id

    if (!groupId) {
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({ challenge_id: challengeId })
        .select('id')
        .single()

      if (groupError) {
        return NextResponse.json(
          { error: `グループ作成失敗: ${groupError.message}` },
          { status: 500 }
        )
      }
      groupId = newGroup!.id
    }

    // 定員チェック
    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if ((memberCount ?? 0) >= challenge.max_group_size) {
      return NextResponse.json({ error: '定員に達しています' }, { status: 400 })
    }

    // いつでも参加 + 締め切りありの場合、締め切り過ぎなら翌日開始
    let joinedAt: string | undefined
    if (challenge.schedule_type === 'flexible' && challenge.checkin_deadline) {
      const now = new Date()
      const [h, m] = challenge.checkin_deadline.split(':').map(Number)
      const deadlineToday = new Date(now)
      deadlineToday.setHours(h, m, 0, 0)
      if (now > deadlineToday) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        joinedAt = tomorrow.toISOString()
      }
    }

    // group_membersにinsert（デポジット0、Stripe情報なし）
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        challenge_id: challengeId,
        deposit_amount: 0,
        deposit_payment_intent_id: null,
        fee_payment_intent_id: null,
        status: 'active',
        ...(joinedAt ? { joined_at: joinedAt } : {}),
      })

    if (joinError) {
      if (joinError.code === '23505') {
        return NextResponse.json({ error: '既に参加しています' }, { status: 409 })
      }
      return NextResponse.json(
        { error: `参加に失敗しました: ${joinError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, groupId })
  } catch (error) {
    console.error('お試し参加エラー:', error)
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
