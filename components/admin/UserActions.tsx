'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  nickname: string
  isBanned: boolean
}

export function UserActions({ userId, nickname, isBanned }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleBan() {
    const reason = window.prompt(`${nickname} をBANする理由を入力してください:`)
    if (reason === null) return // キャンセル
    if (!reason.trim()) {
      alert('理由を入力してください')
      return
    }

    if (!window.confirm(`${nickname} をBANしますか？\n理由: ${reason}`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: reason.trim() }),
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

  async function handleUnban() {
    if (!window.confirm(`${nickname} のBANを解除しますか？`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: null }),
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

  if (isBanned) {
    return (
      <button
        onClick={handleUnban}
        disabled={loading}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? '処理中...' : 'BAN解除'}
      </button>
    )
  }

  return (
    <button
      onClick={handleBan}
      disabled={loading}
      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? '処理中...' : 'BAN'}
    </button>
  )
}
