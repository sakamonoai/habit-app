'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const StripeJoinFlow = dynamic(() => import('@/components/StripeJoinFlow'), {
  loading: () => (
    <div className="text-center py-8">
      <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 mt-2">読み込み中...</p>
    </div>
  ),
})

const DEPOSIT_OPTIONS = [500, 1000, 2000, 3000, 5000, 10000]

type Props = {
  challengeId: string
  isFull: boolean
  depositType?: string
  fixedDepositAmount?: number
}

export default function JoinButton({ challengeId, isFull, depositType = 'choosable', fixedDepositAmount = 1000 }: Props) {
  const [error, setError] = useState('')
  const [showSelector, setShowSelector] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showStripeFlow, setShowStripeFlow] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(depositType === 'fixed' ? fixedDepositAmount : 1000)
  const supabase = createClient()
  const router = useRouter()

  const feeAmount = Math.round(selectedAmount * 0.1)

  const handleConfirmJoin = async () => {
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 確認後、Stripe決済フローを表示
    setShowConfirm(false)
    setShowStripeFlow(true)
  }

  // Stripe決済フロー表示中
  if (showStripeFlow) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 text-center mb-1">カード情報を入力</h3>
        <p className="text-xs text-gray-400 text-center mb-4">安全な決済でチャレンジに参加</p>
        <StripeJoinFlow
          challengeId={challengeId}
          depositAmount={selectedAmount}
          onCancel={() => setShowStripeFlow(false)}
        />
      </div>
    )
  }

  if (!showSelector) {
    return (
      <div>
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        <button
          onClick={() => {
            if (depositType === 'fixed') {
              setSelectedAmount(fixedDepositAmount)
              setShowConfirm(true)
            } else {
              setShowSelector(true)
            }
          }}
          disabled={isFull}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {isFull ? '定員に達しました' : 'このチャレンジに参加する'}
        </button>

        {/* 固定金額の確認ポップアップ */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mt-2">本当に参加しますか？</h3>
              </div>
              <div className="space-y-2 mb-5">
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">デポジット金額</p>
                  <p className="text-xl font-bold text-orange-500">¥{selectedAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">システム利用料</span>
                    <span className="font-semibold">¥{feeAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">利用料は即時引き落としされます</p>
                </div>
                <p className="text-sm text-gray-600">
                  一度チャレンジを始めたら、途中でやめることはできません。
                </p>
                <p className="text-sm text-red-500 font-medium">
                  達成率85%未満の場合、デポジット（¥{selectedAmount.toLocaleString()}）は返金されません。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  やめる
                </button>
                <button
                  onClick={handleConfirmJoin}
                  className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
                >
                  次へ（カード入力）
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowSelector(false)}
        className="w-full py-4 bg-gray-200 text-gray-600 font-semibold rounded-2xl"
      >
        キャンセル
      </button>

      {/* デポジット選択モーダル */}
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowSelector(false)}>
        <div className="bg-white rounded-t-2xl p-5 pb-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-gray-900 text-center mb-1">デポジット金額を選択</h3>
          <p className="text-xs text-gray-400 text-center mb-4">85%以上達成で全額返金されます</p>

          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {DEPOSIT_OPTIONS.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-orange-500 text-white scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ¥{amount.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">デポジット（仮押さえ）</span>
              <span className="font-bold text-orange-500">¥{selectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">システム利用料</span>
              <span className="font-semibold text-gray-700">¥{feeAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSelector(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
            >
              参加する
            </button>
          </div>
        </div>
      </div>

      {/* 確認ポップアップ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mt-2">本当に参加しますか？</h3>
            </div>
            <div className="space-y-2 mb-5">
              <div className="bg-orange-50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">デポジット（仮押さえ）</span>
                  <span className="font-bold text-orange-500">¥{selectedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">システム利用料（即時）</span>
                  <span className="font-semibold text-gray-700">¥{feeAmount.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                一度チャレンジを始めたら、途中でやめることはできません。
              </p>
              <p className="text-sm text-red-500 font-medium">
                達成率85%未満の場合、デポジット（¥{selectedAmount.toLocaleString()}）は返金されません。
              </p>
              <p className="text-sm text-gray-600">
                必ず達成できる自信のある、現実的な金額を選択してください。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                やめる
              </button>
              <button
                onClick={handleConfirmJoin}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
              >
                次へ（カード入力）
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
