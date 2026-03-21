'use client'

import { useState } from 'react'

const REASONS = [
  { label: '不適切な内容', value: 'inappropriate_content' },
  { label: '詐欺・スパム', value: 'fraud_spam' },
  { label: '暴力的・差別的な内容', value: 'violent_discriminatory' },
  { label: 'その他', value: 'other' },
]

type Props = {
  challengeId: string
}

export default function ChallengeReportButton({ challengeId }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)

    try {
      const res = await fetch('/api/reports/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          reason: selected,
          detail: detail.trim() || '',
        }),
      })

      if (res.ok) {
        setDone(true)
        setOpen(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-xs text-gray-400">通報済み</span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        通報する
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-center mb-1">チャレンジを通報</h3>
            <p className="text-xs text-gray-400 text-center mb-4">運営チームが確認します</p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    selected === r.value
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="詳細を入力してください（任意）"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || loading}
                className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                {loading ? '送信中...' : '通報する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
