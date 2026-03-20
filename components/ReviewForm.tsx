'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
}

export default function ReviewForm({ challengeId }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async () => {
    if (rating === 0) { setError('星を選択してください'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('reviews').insert({
      user_id: user.id,
      challenge_id: challengeId,
      rating,
      comment: comment.trim() || null,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('既にレビュー済みです')
      } else {
        setError(`投稿に失敗しました: ${insertError.message}`)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-700 font-semibold text-sm">レビューを投稿しました！</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-3">レビューを書く</h3>

      {/* 星選択 */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className="text-3xl transition-transform active:scale-110"
          >
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>

      {/* コメント */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="チャレンジの感想を書いてください（任意）"
        maxLength={300}
        rows={3}
        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
      />

      {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {loading ? '送信中...' : 'レビューを投稿'}
      </button>
    </div>
  )
}
