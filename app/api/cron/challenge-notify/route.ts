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
  const today = new Date().toISOString().split('T')[0]

  // 今日終了したチャレンジを取得
  const { data: endedChallenges, error: challengeError } = await supabase
    .from('challenges')
    .select('id, title, duration_days')
    .eq('end_date', today)

  if (challengeError || !endedChallenges || endedChallenges.length === 0) {
    return NextResponse.json({
      message: 'No challenges ended today',
      error: challengeError?.message,
    })
  }

  let sent = 0
  const staleIds: string[] = []

  for (const challenge of endedChallenges) {
    // チャレンジのメンバーを取得
    const { data: members } = await supabase
      .from('challenge_members')
      .select('id, user_id')
      .eq('challenge_id', challenge.id)

    if (!members || members.length === 0) continue

    for (const member of members) {
      // メンバーのチェックイン数を取得
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)

      const checkinCount = count ?? 0
      const rate = (checkinCount / challenge.duration_days) * 100

      let title: string
      let body: string

      if (rate >= 85) {
        title = '🎉 チャレンジ達成！'
        body = `「${challenge.title}」を達成率${Math.round(rate)}%でクリア！デポジットは引き落とされません。おめでとうございます！`
      } else {
        title = 'チャレンジ終了'
        body = `「${challenge.title}」の達成率は${Math.round(rate)}%でした。85%に届きませんでした。次回また挑戦しましょう！`
      }

      // このユーザーのpush subscriptionを取得して通知送信
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', member.user_id)

      if (!subscriptions || subscriptions.length === 0) continue

      const payload = JSON.stringify({
        title,
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
  }

  // 無効なsubscriptionを削除
  if (staleIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', staleIds)
  }

  return NextResponse.json({
    challenges: endedChallenges.length,
    sent,
    removed: staleIds.length,
  })
}
