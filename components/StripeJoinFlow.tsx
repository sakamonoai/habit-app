'use client'

import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe-client'
import { useRouter } from 'next/navigation'

type StripeJoinFlowProps = {
  challengeId: string
  depositAmount: number
  onCancel: () => void
}

function CheckoutForm({
  challengeId,
  depositAmount,
  onCancel,
}: StripeJoinFlowProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'processing' | 'done'>('input')

  const feeAmount = 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')
    setStep('processing')

    try {
      // 1. SetupIntentを取得
      const setupRes = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
      })
      const setupData = await setupRes.json()

      if (!setupRes.ok) {
        throw new Error(setupData.error || 'SetupIntentの作成に失敗しました')
      }

      // 2. カード情報を確認してSetupIntentを確定
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('カード情報が入力されていません')
      }

      const { error: confirmError, setupIntent } =
        await stripe.confirmCardSetup(setupData.clientSecret, {
          payment_method: {
            card: cardElement,
          },
        })

      if (confirmError) {
        throw new Error(confirmError.message || 'カード認証に失敗しました')
      }

      if (!setupIntent?.payment_method) {
        throw new Error('支払い方法の保存に失敗しました')
      }

      // 3. サーバーで手数料決済 + デポジットオーソリ + 参加処理
      const joinRes = await fetch('/api/stripe/confirm-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          depositAmount,
          paymentMethodId: setupIntent.payment_method,
        }),
      })
      const joinData = await joinRes.json()

      if (!joinRes.ok) {
        throw new Error(joinData.error || '参加処理に失敗しました')
      }

      // 4. 成功 → グループページへ遷移
      setStep('done')
      router.push(`/group/${joinData.groupId}`)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(message)
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 金額内訳 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">デポジット（仮押さえ）</span>
            <span className="font-semibold text-gray-900">
              ¥{depositAmount.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="text-gray-600">今回の引き落とし</span>
            <span className="font-bold text-green-600">¥0（無料）</span>
          </div>
          <p className="text-xs text-gray-400">
            デポジットはカードに仮押さえされますが、85%以上達成で引き落とされません。
          </p>
        </div>

        {/* カード入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード情報
          </label>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444' },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-2">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-2">決済処理中...</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={loading || !stripe}
            className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? '処理中...' : '参加する（無料）'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          カード情報はStripeにより安全に管理されます。当社がカード番号を保存することはありません。
        </p>
      </div>
    </form>
  )
}

export default function StripeJoinFlow(props: StripeJoinFlowProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
