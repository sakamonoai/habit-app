import { createClient } from '@/lib/supabase/server'
import { getWebPush } from '@/lib/webpush'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 内部用: CRON_SECRETヘッダーで保護
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, title, body, url } = await req.json()
  if (!userId || !title) {
    return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const payload = JSON.stringify({ title, body: body ?? '', url: url ?? '/home' })

  let sent = 0
  const staleIds: string[] = []

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
      // 410 Gone or 404 Not Found → subscription is no longer valid
      if (statusCode === 410 || statusCode === 404) {
        staleIds.push(sub.id)
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

  return NextResponse.json({ sent, removed: staleIds.length })
}
