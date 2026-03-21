'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
  currentStatus: string
}

export function ChallengeActions({ challengeId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSuspend() {
    const reason = window.prompt('非公開にする理由を入力してください:')
    if (reason === null) return // キャンセル
    if (!reason.trim()) {
      alert('理由を入力してください')
      return
    }

    if (
      !window.confirm(
        `このチャレンジを非公開にしますか？\n理由: ${reason}\n\n※ アクティブメンバーのデポジットは解放されます`
      )
    )
      return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/challenges/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          action: 'suspend',
          reason: reason.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'エラーが発生しました')
        return
      }
      router.refresh()
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsuspend() {
    if (!window.confirm('このチャレンジを公開に戻しますか？')) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/challenges/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, action: 'unsuspend' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'エラーが発生しました')
        return
      }
      router.refresh()
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'suspended') {
    return (
      <button
        onClick={handleUnsuspend}
        disabled={loading}
        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '公開に戻す'}
      </button>
    )
  }

  return (
    <button
      onClick={handleSuspend}
      disabled={loading}
      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? '処理中...' : '非公開にする'}
    </button>
  )
}
