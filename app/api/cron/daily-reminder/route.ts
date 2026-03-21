import { createClient } from '@/lib/supabase/server'
import { getWebPush } from '@/lib/webpush'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Vercel Cronからの呼び出しを検証
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // アクティブなチャレンジに参加中のメンバーを取得
  const { data: activeMembers, error: membersError } = await supabase
    .from('challenge_members')
    .select(`
      id,
      user_id,
      challenge_id,
      challenges!inner (
        id,
        title,
        start_date,
        end_date,
        duration_days
      )
    `)
    .eq('challenges.status', 'active')

  if (membersError || !activeMembers) {
    return NextResponse.json({ error: membersError?.message ?? 'No data' }, { status: 500 })
  }

  // 今日のチェックイン済みメンバーIDを取得
  const memberIds = activeMembers.map((m) => m.id)
  const { data: todayCheckins } = await supabase
    .from('checkins')
    .select('member_id')
    .in('member_id', memberIds)
    .gte('created_at', `${today}T00:00:00+09:00`)
    .lt('created_at', `${today}T23:59:59+09:00`)

  const checkedInMemberIds = new Set((todayCheckins ?? []).map((c) => c.member_id))

  // 未チェックインのメンバーをフィルタ
  const uncheckedMembers = activeMembers.filter((m) => !checkedInMemberIds.has(m.id))

  let sent = 0
  const staleIds: string[] = []

  for (const member of uncheckedMembers) {
    const challenge = member.challenges as unknown as {
      id: string
      title: string
      end_date: string
      duration_days: number
    }

    // 締切までの残り日数を計算
    const endDate = new Date(challenge.end_date)
    const now = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let body = `「${challenge.title}」の今日のチェックインをお忘れなく！`
    if (daysLeft <= 3 && daysLeft > 0) {
      body = `⚡ 残り${daysLeft}日！「${challenge.title}」のチェックインをお忘れなく！`
    }

    // このユーザーのpush subscriptionを取得して通知送信
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', member.user_id)

    if (!subscriptions || subscriptions.length === 0) continue

    const payload = JSON.stringify({
      title: 'ハビチャレ',
      body,
      url: `/challenges/${challenge.id}`,
    })

    for (const sub of subscriptions) {
      try {
        await getWebPush().sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          staleIds.push(sub.id)
        }
      }
    }
  }

  // 無効なsubscriptionを削除
  if (staleIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', staleIds)
  }

  return NextResponse.json({
    checked: uncheckedMembers.length,
    sent,
    removed: staleIds.length,
  })
}
