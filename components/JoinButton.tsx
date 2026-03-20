'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const DEPOSIT_OPTIONS = [500, 1000, 2000, 3000, 5000, 10000]

type Props = {
  challengeId: string
  isFull: boolean
  depositType?: string
  fixedDepositAmount?: number
}

export default function JoinButton({ challengeId, isFull, depositType = 'choosable', fixedDepositAmount = 1000 }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSelector, setShowSelector] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(depositType === 'fixed' ? fixedDepositAmount : 1000)
  const supabase = createClient()
  const router = useRouter()

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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
        setError(`グループ作成失敗: ${groupError.message}`)
        setLoading(false)
        return
      }
      groupId = newGroup!.id
    }

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        challenge_id: challengeId,
        deposit_amount: selectedAmount,
      })

    if (joinError) {
      if (joinError.code === '23505') {
        setError('既に参加しています')
      } else {
        setError(`参加に失敗しました: ${joinError.message}`)
      }
      setLoading(false)
      return
    }

    router.push(`/group/${groupId}`)
    router.refresh()
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
                <span className="text-4xl">⚠️</span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">本当に参加しますか？</h3>
              </div>
              <div className="space-y-2 mb-5">
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">デポジット金額</p>
                  <p className="text-xl font-bold text-orange-500">¥{selectedAmount.toLocaleString()}</p>
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
                  onClick={() => { setShowConfirm(false); handleJoin() }}
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? '処理中...' : '参加する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
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
          <span className="text-gray-600">デポジット</span>
          <span className="font-bold text-orange-500">¥{selectedAmount.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">※ 決済機能は現在準備中です（無料で参加できます）</p>
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
          disabled={loading}
          className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          参加する
        </button>
      </div>

      {/* 確認ポップアップ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">本当に参加しますか？</h3>
            </div>
            <div className="space-y-2 mb-5">
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
                onClick={() => { setShowConfirm(false); handleJoin() }}
                disabled={loading}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? '処理中...' : '参加する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
