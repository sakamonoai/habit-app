'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REASONS = [
  { label: '無関係な写真', value: 'irrelevant_photo' },
  { label: '使い回しの写真', value: 'reused_photo' },
  { label: '他人の写真', value: 'stolen_photo' },
  { label: 'その他の不正', value: 'other' },
]

type Props = {
  checkinId: string
  alreadyReported: boolean
}

export default function ReportButton({ checkinId, alreadyReported }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyReported)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      checkin_id: checkinId,
      reason: selected,
      detail: detail.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        setDone(true)
      }
    } else {
      setDone(true)
    }
    setLoading(false)
    setOpen(false)
  }

  if (done) {
    return (
      <span className="text-xs text-gray-300">報告済み</span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-gray-400 hover:text-red-400 transition-colors p-1"
        title="不正を報告"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 12.25v-8.5a.75.75 0 0 0-.904-.734l-2.38.501a7.25 7.25 0 0 1-4.186-.363l-.502-.2a8.75 8.75 0 0 0-5.053-.439l-1.475.31V2.75Z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-center mb-1">不正な記録を報告</h3>
            <p className="text-xs text-gray-400 text-center mb-4">運営チームが確認します</p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    selected === r.value
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {selected === 'other' && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="詳細を入力してください"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            )}

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
                className="flex-[2] py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {loading ? '送信中...' : '報告する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
