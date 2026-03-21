'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LegalFooter from '@/components/LegalFooter'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError('利用規約とプライバシーポリシーに同意してください')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      console.error('Signup error:', signUpError.message)
      setError(`登録に失敗しました: ${signUpError.message}`)
      setLoading(false)
      return
    }

    // ニックネームと同意日時を更新
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          nickname,
          terms_agreed_at: new Date().toISOString(),
          terms_version: '1.0',
        })
        .eq('id', user.id)
    }

    router.push('/challenges')
  }

  /**
   * OAuth 登録（Google / Apple）
   *
   * Supabase が自動的に新規ユーザーか既存ユーザーかを判別します。
   * OAuth 経由の場合、同意記録はコールバック後のプロフィール設定で記録されます。
   *
   * Supabase ダッシュボードで各プロバイダの設定が必要:
   * - Google: Authentication > Providers > Google で Client ID / Secret を設定
   * - Apple: Authentication > Providers > Apple で Service ID / Secret を設定
   *   ※ Apple Sign In には Apple Developer Program の登録が必要です
   */
  const handleOAuthSignup = async (provider: 'google' | 'apple') => {
    if (!agreedToTerms) {
      setError('利用規約とプライバシーポリシーに同意してください')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      setError('登録に失敗しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-2xl font-bold text-gray-900">ハビチャレ</h1>
          <p className="mt-1 text-gray-400 text-sm">仲間と一緒に習慣を作ろう</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">新規登録</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* 利用規約同意チェックボックス */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
              />
              <span className="text-sm text-gray-600">
                <Link href="/terms" className="text-orange-500 hover:underline" target="_blank">
                  利用規約
                </Link>
                {' '}と{' '}
                <Link href="/privacy" className="text-orange-500 hover:underline" target="_blank">
                  プライバシーポリシー
                </Link>
                {' '}に同意する
              </span>
            </label>
          </div>

          {/* ソーシャルログイン */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthSignup('google')}
              disabled={loading || !agreedToTerms}
              className="w-full py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleで始める
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignup('apple')}
              disabled={loading || !agreedToTerms}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Appleで始める
            </button>
          </div>

          {/* セパレーター */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">または</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ニックネーム
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="がんばるたろう"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="6文字以上"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（確認）
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                  passwordConfirm && password !== passwordConfirm
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
                placeholder="もう一度入力"
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-red-500 text-xs mt-1">パスワードが一致しません</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms || (!!passwordConfirm && password !== passwordConfirm)}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '登録中...' : '無料で始める'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            すでにアカウントがある方は{' '}
            <Link href="/login" className="text-orange-500 font-medium hover:underline">
              ログイン
            </Link>
          </p>
        </div>

        <LegalFooter />
      </div>
    </div>
  )
}
