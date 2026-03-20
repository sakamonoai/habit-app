'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
  depositAmount: number
  isFull: boolean
}

export default function JoinButton({ challengeId, depositAmount, isFull }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

    // グループが存在するか確認、なければ作成
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

    // メンバーとして参加
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        challenge_id: challengeId,
        deposit_amount: depositAmount,
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

  return (
    <div>
      {error && (
        <p className="text-red-500 text-sm text-center mb-2">{error}</p>
      )}
      <button
        onClick={handleJoin}
        disabled={loading || isFull}
        className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {isFull ? '定員に達しました' : loading ? '参加処理中...' : 'このチャレンジに参加する'}
      </button>
    </div>
  )
}
