'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'サービスについて',
  '不具合の報告',
  'デポジット・決済について',
  'ご要望・ご意見',
  'その他',
]

export default function ContactPage() {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!category || !message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, reply_email: replyEmail.trim() || null }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        alert('送信に失敗しました。時間をおいて再度お試しください。')
      }
    } catch {
      alert('送信に失敗しました。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mr-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">お問い合わせ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {sent ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-lg font-semibold text-gray-900 mb-2">送信しました</p>
            <p className="text-sm text-gray-500 mb-6">通常2営業日以内にご返信いたします。</p>
            <button
              onClick={() => router.back()}
              className="text-orange-500 text-sm font-medium"
            >
              ← 戻る
            </button>
          </div>
        ) : (
          <>
            {/* フォーム */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        category === cat
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="お気軽にご記入ください"
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">返信用メールアドレス<span className="text-gray-400 font-normal ml-1">（任意）</span></label>
                <p className="text-xs text-gray-400 mb-2">返信が必要な内容の場合は、メールアドレスをご記入ください。</p>
                <input
                  type="email"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!category || !message.trim() || sending}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? '送信中...' : '送信する'}
              </button>
            </div>

            {/* 直接連絡 */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 mb-3">直接ご連絡いただくこともできます</p>
              <div className="space-y-3">
                <a
                  href="https://x.com/AImaru_company"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                    X
                  </div>
                  <span className="text-sm text-gray-700">@AImaru_company</span>
                  <span className="ml-auto text-gray-300 text-sm">→</span>
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
