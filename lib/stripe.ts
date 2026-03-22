import Stripe from 'stripe'

let _stripe: Stripe | null = null

/** Stripeクライアント（遅延初期化でビルド時エラーを回避） */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

/** 後方互換: 既存コードから `stripe` として使えるように */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

/** 手数料率（デポジット金額に対する割合） */
export const FEE_RATE = 0

/** 手数料を計算（円） */
export function calcFee(_depositAmount: number): number {
  return 0
}

/** 達成率の返金しきい値（%） */
export const ACHIEVEMENT_THRESHOLD = 85
