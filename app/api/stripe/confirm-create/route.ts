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
    const {
      challengeData,
      depositAmount,
      paymentMethodId,
    } = body as {
      challengeData: Record<string, unknown>
      depositAmount: number
      paymentMethodId: string
    }

    if (!challengeData || !depositAmount || !paymentMethodId) {
      return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })
    }

    if (depositAmount < 500 || depositAmount > 10000) {
      return NextResponse.json({ error: 'デポジット金額が範囲外です' }, { status: 400 })
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

    // 1. 手数料のPaymentIntent（手数料が0なら作成しない）
    let feePaymentIntentId: string | null = null
    if (feeAmount > 0) {
      const feePaymentIntent = await stripe.paymentIntents.create({
        amount: feeAmount,
        currency: 'jpy',
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: 'automatic',
        confirm: true,
        off_session: true,
        description: `チャレンジ作成手数料`,
        metadata: {
          type: 'fee',
          user_id: user.id,
          deposit_amount: String(depositAmount),
        },
      })

      if (feePaymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: '手数料の決済に失敗しました' }, { status: 400 })
      }
      feePaymentIntentId = feePaymentIntent.id
    }

    // 2. デポジットのPaymentIntent（オーソリのみ）
    const depositPaymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'jpy',
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
      description: `チャレンジデポジット`,
      metadata: {
        type: 'deposit',
        user_id: user.id,
      },
    })

    if (depositPaymentIntent.status !== 'requires_capture') {
      if (feePaymentIntentId) {
        await stripe.refunds.create({ payment_intent: feePaymentIntentId })
      }
      return NextResponse.json(
        { error: 'デポジットのオーソリに失敗しました。' },
        { status: 400 }
      )
    }

    // 3. チャレンジ作成
    const { data: challenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        ...challengeData,
        created_by: user.id,
        status: 'active',
      })
      .select('id')
      .single()

    if (createError) {
      const cancels: Promise<unknown>[] = [stripe.paymentIntents.cancel(depositPaymentIntent.id)]
      if (feePaymentIntentId) cancels.push(stripe.refunds.create({ payment_intent: feePaymentIntentId }))
      await Promise.all(cancels)
      return NextResponse.json(
        { error: `チャレンジ作成失敗: ${createError.message}` },
        { status: 500 }
      )
    }

    // 4. グループ作成
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ challenge_id: challenge.id })
      .select('id')
      .single()

    if (groupError) {
      const cancels: Promise<unknown>[] = [stripe.paymentIntents.cancel(depositPaymentIntent.id)]
      if (feePaymentIntentId) cancels.push(stripe.refunds.create({ payment_intent: feePaymentIntentId }))
      await Promise.all(cancels)
      return NextResponse.json(
        { error: `グループ作成失敗: ${groupError.message}` },
        { status: 500 }
      )
    }

    // 5. 作成者をメンバーとして追加
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        challenge_id: challenge.id,
        deposit_amount: depositAmount,
        deposit_payment_intent_id: depositPaymentIntent.id,
        fee_payment_intent_id: feePaymentIntentId,
        status: 'active',
      })

    if (joinError) {
      const cancels: Promise<unknown>[] = [stripe.paymentIntents.cancel(depositPaymentIntent.id)]
      if (feePaymentIntentId) cancels.push(stripe.refunds.create({ payment_intent: feePaymentIntentId }))
      await Promise.all(cancels)
      return NextResponse.json(
        { error: `参加処理失敗: ${joinError.message}` },
        { status: 500 }
      )
    }

    // PaymentIntentにchallenge_idを追記
    const updates: Promise<unknown>[] = [
      stripe.paymentIntents.update(depositPaymentIntent.id, {
        metadata: { ...depositPaymentIntent.metadata, challenge_id: challenge.id },
      }),
    ]
    if (feePaymentIntentId) {
      updates.push(stripe.paymentIntents.update(feePaymentIntentId, {
        metadata: { type: 'fee', challenge_id: challenge.id, user_id: user.id, deposit_amount: String(depositAmount) },
      }))
    }
    await Promise.all(updates)

    return NextResponse.json({
      ok: true,
      challengeId: challenge.id,
      groupId: group.id,
    })
  } catch (error) {
    console.error('チャレンジ作成+決済エラー:', error)
    const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
