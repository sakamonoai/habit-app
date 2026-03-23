'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoadingHistory(true)
    // announcement タイプの通知をグループ化して取得（同じtitle+created_atでグループ）
    const { data } = await supabase
      .from('notifications')
      .select('title, body, url, created_at')
      .eq('type', 'announcement')
      .order('created_at', { ascending: false })
      .limit(200)

    // 同じタイトル＆時刻（秒単位）でグループ化
    const grouped = new Map<string, { title: string; body: string | null; url: string | null; created_at: string; count: number }>()
    for (const n of data ?? []) {
      const key = `${n.title}_${n.created_at?.slice(0, 19)}`
      if (grouped.has(key)) {
        grouped.get(key)!.count++
      } else {
        grouped.set(key, { ...n, count: 1 })
      }
    }
    setHistory(Array.from(grouped.values()))
    setLoadingHistory(false)
  }

  const handleSend = async () => {
    if (!title.trim()) return
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || null,
          url: url.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: `${data.sent}人のユーザーに送信しました` })
        setTitle('')
        setBody('')
        setUrl('')
        loadHistory()
      } else {
        setResult({ ok: false, message: data.error || '送信に失敗しました' })
      }
    } catch {
      setResult({ ok: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">お知らせ配信</h2>
      <p className="text-sm text-gray-500 mb-8">全ユーザーにお知らせ通知を送信します</p>

      {/* 送信フォーム */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">新しいお知らせ</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: メンテナンスのお知らせ"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="お知らせの詳細を入力してください"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none h-28"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              リンクURL（任意）
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="例: /challenges"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">通知をタップした時の遷移先</p>
          </div>
        </div>

        {result && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
            result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.message}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!title.trim() || sending}
          className="mt-6 w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all"
        >
          {sending ? '送信中...' : '全ユーザーに送信'}
        </button>
      </div>

      {/* 送信履歴 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">送信履歴</h3>

        {loadingHistory ? (
          <p className="text-sm text-gray-400 text-center py-8">読み込み中...</p>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                    {h.body && <p className="text-xs text-gray-500 mt-1">{h.body}</p>}
                    {h.url && <p className="text-xs text-gray-400 mt-1">リンク: {h.url}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {h.count}人に送信
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(h.created_at).toLocaleString('ja-JP', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo',
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">まだお知らせを送信していません</p>
        )}
      </div>
    </div>
  )
}
