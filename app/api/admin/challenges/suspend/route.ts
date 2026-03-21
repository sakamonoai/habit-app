import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    // 1. ログインユーザーを取得
    const { user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: '未認証' }, { status: 401 })
    }

    // 2. 管理者チェック
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 3. リクエストボディを解析
    const { challengeId, action, reason } = await req.json()

    if (!challengeId || !action) {
      return NextResponse.json(
        { error: 'challengeId と action は必須です' },
        { status: 400 }
      )
    }

    if (action !== 'suspend' && action !== 'unsuspend') {
      return NextResponse.json(
        { error: "action は 'suspend' または 'unsuspend' のみ有効です" },
        { status: 400 }
      )
    }

    // 4. チャレンジの存在確認
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, status, title')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'チャレンジが見つかりません' },
        { status: 404 }
      )
    }

    // 5. アクション実行
    if (action === 'suspend') {
      // チャレンジを非公開にする
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'suspended',
          suspended_reason: reason || null,
        })
        .eq('id', challengeId)

      if (updateError) {
        console.error('チャレンジ更新エラー:', updateError)
        return NextResponse.json(
          { error: 'チャレンジの更新に失敗しました' },
          { status: 500 }
        )
      }

      // アクティブメンバーのデポジットをキャンセル
      const { data: activeMembers } = await supabase
        .from('group_members')
        .select('id, deposit_payment_intent_id')
        .eq('challenge_id', challengeId)
        .eq('status', 'active')

      let canceledCount = 0
      if (activeMembers && activeMembers.length > 0) {
        for (const member of activeMembers) {
          // Stripe PaymentIntentをキャンセル（デポジットを解放）
          if (member.deposit_payment_intent_id) {
            try {
              await stripe.paymentIntents.cancel(
                member.deposit_payment_intent_id
              )
              canceledCount++
            } catch (err) {
              // 既にキャンセル済みの場合などはスキップ
              console.warn(
                `PaymentIntent ${member.deposit_payment_intent_id} のキャンセルをスキップ:`,
                err
              )
            }
          }
        }

        // メンバーのステータスを completed に更新
        const { error: memberError } = await supabase
          .from('group_members')
          .update({ status: 'completed' })
          .eq('challenge_id', challengeId)
          .eq('status', 'active')

        if (memberError) {
          console.error('メンバー更新エラー:', memberError)
        }
      }

      return NextResponse.json({
        success: true,
        message: `チャレンジ「${challenge.title}」を非公開にしました`,
        canceledDeposits: canceledCount,
      })
    } else {
      // unsuspend: チャレンジを公開に戻す
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'active',
          suspended_reason: null,
        })
        .eq('id', challengeId)

      if (updateError) {
        console.error('チャレンジ更新エラー:', updateError)
        return NextResponse.json(
          { error: 'チャレンジの更新に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `チャレンジ「${challenge.title}」を公開に戻しました`,
      })
    }
  } catch (err) {
    console.error('チャレンジ停止APIエラー:', err)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
