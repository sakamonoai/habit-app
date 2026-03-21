import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { stripe, calcFee } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, depositAmount, paymentMethodId } = body as {
      challengeId: string
      depositAmount: number
      paymentMethodId: string
    }

    if (!challengeId || !depositAmount || !paymentMethodId) {
      return NextResponse.json(
        { error: 'パラメータが不足しています' },
        { status: 400 }
      )
    }

    if (depositAmount < 500 || depositAmount > 10000) {
      return NextResponse.json(
        { error: 'デポジット金額が範囲外です' },
        { status: 400 }
      )
    }

    // stripe_customer_idを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe顧客情報がありません。再度お試しください。' },
        { status: 400 }
      )
    }

    const customerId = profile.stripe_customer_id
    const feeAmount = calcFee(depositAmount)

    // 1. 手数料のPaymentIntent（即時決済）
    const feePaymentIntent = await stripe.paymentIntents.create({
      amount: feeAmount,
      currency: 'jpy',
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'automatic',
      confirm: true,
      off_session: true,
      description: `チャレンジ参加手数料 (${challengeId})`,
      metadata: {
        type: 'fee',
        challenge_id: challengeId,
        user_id: user.id,
        deposit_amount: String(depositAmount),
      },
    })

    if (feePaymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: '手数料の決済に失敗しました' },
        { status: 400 }
      )
    }

    // 2. デポジットのPaymentIntent（オーソリのみ、引き落としなし）
    const depositPaymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'jpy',
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
      description: `チャレンジデポジット (${challengeId})`,
      metadata: {
        type: 'deposit',
        challenge_id: challengeId,
        user_id: user.id,
      },
    })

    if (
      depositPaymentIntent.status !== 'requires_capture'
    ) {
      // デポジットのオーソリ失敗時、手数料を返金
      await stripe.refunds.create({
        payment_intent: feePaymentIntent.id,
      })
      return NextResponse.json(
        { error: 'デポジットのオーソリに失敗しました。手数料は返金されます。' },
        { status: 400 }
      )
    }

    // 3. グループを取得or作成
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
        // グループ作成失敗 → 両方キャンセル/返金
        await Promise.all([
          stripe.paymentIntents.cancel(depositPaymentIntent.id),
          stripe.refunds.create({ payment_intent: feePaymentIntent.id }),
        ])
        return NextResponse.json(
          { error: `グループ作成失敗: ${groupError.message}` },
          { status: 500 }
        )
      }
      groupId = newGroup!.id
    }

    // 4. group_membersにinsert
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        challenge_id: challengeId,
        deposit_amount: depositAmount,
        deposit_payment_intent_id: depositPaymentIntent.id,
        fee_payment_intent_id: feePaymentIntent.id,
        status: 'active',
      })

    if (joinError) {
      // 参加失敗 → 両方キャンセル/返金
      await Promise.all([
        stripe.paymentIntents.cancel(depositPaymentIntent.id),
        stripe.refunds.create({ payment_intent: feePaymentIntent.id }),
      ])

      if (joinError.code === '23505') {
        return NextResponse.json(
          { error: '既に参加しています' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `参加に失敗しました: ${joinError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      groupId,
      feePaymentIntentId: feePaymentIntent.id,
      depositPaymentIntentId: depositPaymentIntent.id,
    })
  } catch (error) {
    console.error('参加確定エラー:', error)
    const message =
      error instanceof Error ? error.message : '不明なエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
