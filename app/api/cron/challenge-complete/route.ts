import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, ACHIEVEMENT_THRESHOLD } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  // CRON_SECRETの検証
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // 終了日を過ぎたactiveチャレンジを取得
    const { data: challenges, error: fetchError } = await supabase
      .from('challenges')
      .select('id, duration_days, start_date, end_date')
      .eq('status', 'active')

    if (fetchError) {
      console.error('チャレンジ取得エラー:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ message: '処理対象なし', processed: 0 })
    }

    // 終了日を過ぎたチャレンジをフィルタ
    const expiredChallenges = challenges.filter((c) => {
      if (c.end_date) {
        return c.end_date <= today
      }
      // start_date + duration_daysで計算
      if (c.start_date && c.duration_days) {
        const endDate = new Date(c.start_date)
        endDate.setDate(endDate.getDate() + c.duration_days)
        return endDate.toISOString().split('T')[0] <= today
      }
      return false
    })

    let processedCount = 0
    const errors: string[] = []

    for (const challenge of expiredChallenges) {
      try {
        // このチャレンジのactiveメンバーを取得
        const { data: members } = await supabase
          .from('group_members')
          .select('id, user_id, deposit_payment_intent_id, status')
          .eq('challenge_id', challenge.id)
          .eq('status', 'active')

        if (!members || members.length === 0) {
          // メンバーがいなくてもチャレンジは完了にする
          await supabase
            .from('challenges')
            .update({ status: 'completed' })
            .eq('id', challenge.id)
          processedCount++
          continue
        }

        for (const member of members) {
          try {
            // チェックイン日数を取得（ユニーク日数）
            const { count: checkinDays } = await supabase
              .from('checkins')
              .select('*', { count: 'exact', head: true })
              .eq('member_id', member.id)

            const achievementRate = Math.round(
              ((checkinDays ?? 0) / challenge.duration_days) * 100
            )

            if (achievementRate >= ACHIEVEMENT_THRESHOLD) {
              // 達成: オーソリをキャンセル（引き落とされない）
              if (member.deposit_payment_intent_id) {
                await stripe.paymentIntents.cancel(
                  member.deposit_payment_intent_id
                )
              }
              await supabase
                .from('group_members')
                .update({ status: 'completed' })
                .eq('id', member.id)
            } else {
              // 未達: オーソリをキャプチャ（引き落とし＝運営収益）
              if (member.deposit_payment_intent_id) {
                await stripe.paymentIntents.capture(
                  member.deposit_payment_intent_id
                )
              }
              await supabase
                .from('group_members')
                .update({ status: 'forfeited' })
                .eq('id', member.id)
            }
          } catch (memberError) {
            const msg = memberError instanceof Error ? memberError.message : String(memberError)
            console.error(`メンバー ${member.id} の処理エラー:`, msg)
            errors.push(`member:${member.id} - ${msg}`)
          }
        }

        // チャレンジを完了に更新
        await supabase
          .from('challenges')
          .update({ status: 'completed' })
          .eq('id', challenge.id)

        processedCount++
      } catch (challengeError) {
        const msg = challengeError instanceof Error ? challengeError.message : String(challengeError)
        console.error(`チャレンジ ${challenge.id} の処理エラー:`, msg)
        errors.push(`challenge:${challenge.id} - ${msg}`)
      }
    }

    return NextResponse.json({
      message: '処理完了',
      processed: processedCount,
      total: expiredChallenges.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron処理エラー:', error)
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
