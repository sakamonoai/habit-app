'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError('送信に失敗しました。メールアドレスを確認してください。')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">パスワード再設定</h1>
          <p className="mt-1 text-gray-400 text-sm">登録メールアドレスにリセットリンクを送信します</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📩</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">メールを送信しました</h2>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-medium text-gray-700">{email}</span> にパスワード再設定リンクを送信しました。メールを確認してください。
              </p>
              <p className="text-xs text-gray-400 mb-6">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
              <Link
                href="/login"
                className="inline-block py-3 px-6 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                ログインに戻る
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? '送信中...' : 'リセットリンクを送信'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/login" className="text-orange-500 font-medium hover:underline">
                  ログインに戻る
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
