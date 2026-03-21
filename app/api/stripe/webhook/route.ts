import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

/**
 * Supabase管理クライアント（service_role key）
 * Webhookにはユーザーセッションがないため、RLSをバイパスする必要がある
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase環境変数が設定されていません')
  }
  return createClient(url, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Stripeに500を返すとリトライされるため、処理エラーでも200を返す
    // ただし重要なエラーはログに残す
  }

  return NextResponse.json({ received: true })
}

// ---------------------------------------------------------------------------
// payment_intent.payment_failed
// ---------------------------------------------------------------------------
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const piId = paymentIntent.id
  const metadata = paymentIntent.metadata
  const piType = metadata?.type // 'fee' or 'deposit'

  console.error(`[Webhook] payment_intent.payment_failed: ${piId}, type=${piType}`)

  const supabase = getSupabaseAdmin()

  // deposit_payment_intent_id または fee_payment_intent_id で検索
  const { data: memberByDeposit } = await supabase
    .from('group_members')
    .select('id, user_id, fee_payment_intent_id, deposit_payment_intent_id, status')
    .eq('deposit_payment_intent_id', piId)
    .maybeSingle()

  const { data: memberByFee } = await supabase
    .from('group_members')
    .select('id, user_id, fee_payment_intent_id, deposit_payment_intent_id, status')
    .eq('fee_payment_intent_id', piId)
    .maybeSingle()

  const member = memberByDeposit || memberByFee

  if (!member) {
    console.error(`[Webhook] No group_member found for payment_intent ${piId}`)
    return
  }

  // 冪等性チェック: 既に削除済み or forfeited なら何もしない
  if (member.status === 'forfeited') {
    console.log(`[Webhook] Member ${member.id} already forfeited, skipping`)
    return
  }

  if (memberByFee) {
    // 手数料の支払い失敗 → 参加取り消し（レコード削除）
    console.error(`[Webhook] Fee payment failed for member ${member.id}, removing membership`)

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', member.id)

    if (error) {
      console.error(`[Webhook] Failed to delete group_member ${member.id}:`, error)
    }
  } else if (memberByDeposit) {
    // デポジットのオーソリ失敗 → 手数料を返金 + レコード削除
    console.error(`[Webhook] Deposit auth failed for member ${member.id}, refunding fee and removing membership`)

    if (member.fee_payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: member.fee_payment_intent_id,
        })
        console.log(`[Webhook] Fee refunded for payment_intent ${member.fee_payment_intent_id}`)
      } catch (refundErr) {
        // 既に返金済みの場合などはエラーになるが、冪等性のため無視
        console.error(`[Webhook] Fee refund failed (may already be refunded):`, refundErr)
      }
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', member.id)

    if (error) {
      console.error(`[Webhook] Failed to delete group_member ${member.id}:`, error)
    }
  }

  // 通知レコードをDBに書き込む（push送信はcron等で別途処理）
  if (member.user_id) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: member.user_id,
          title: '決済に問題が発生しました',
          body: 'お支払いの処理中にエラーが発生しました。詳細をご確認ください。',
          url: '/dashboard',
          read: false,
        })
    } catch (notifErr) {
      // notifications テーブルが存在しない場合など、通知失敗は致命的ではない
      console.error('[Webhook] Failed to insert notification:', notifErr)
    }
  }
}

// ---------------------------------------------------------------------------
// charge.dispute.created
// ---------------------------------------------------------------------------
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.error(
    `[Webhook] charge.dispute.created: dispute=${dispute.id}, ` +
    `charge=${dispute.charge}, amount=${dispute.amount}, ` +
    `reason=${dispute.reason}, status=${dispute.status}`
  )

  // 将来的にdisputesテーブルを作成して保存する可能性があるが、
  // 現時点ではconsole.errorでログに記録するのみ
  // Vercelのログやログ監視ツールでアラートを設定する想定
}

// ---------------------------------------------------------------------------
// payment_intent.canceled
// ---------------------------------------------------------------------------
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const piId = paymentIntent.id
  const metadata = paymentIntent.metadata

  console.log(`[Webhook] payment_intent.canceled: ${piId}, type=${metadata?.type}`)

  // デポジットのオーソリがキャンセル（期限切れ等）された場合のみ処理
  if (metadata?.type !== 'deposit') {
    console.log(`[Webhook] Ignoring cancel for non-deposit payment_intent ${piId}`)
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: member } = await supabase
    .from('group_members')
    .select('id, user_id, status')
    .eq('deposit_payment_intent_id', piId)
    .maybeSingle()

  if (!member) {
    console.error(`[Webhook] No group_member found for canceled deposit ${piId}`)
    return
  }

  // 冪等性チェック: 既に完了 or 没収済みなら何もしない
  if (member.status !== 'active') {
    console.log(`[Webhook] Member ${member.id} status is '${member.status}', skipping cancel handling`)
    return
  }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'forfeited' })
    .eq('id', member.id)
    .eq('status', 'active') // 楽観的ロック: activeの場合のみ更新

  if (error) {
    console.error(`[Webhook] Failed to update member ${member.id} to forfeited:`, error)
  } else {
    console.log(`[Webhook] Member ${member.id} status updated to forfeited`)
  }
}
