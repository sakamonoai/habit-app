'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  initialNickname: string
  initialAvatarUrl: string | null
  initialEmail: string
}

export default function ProfileSettings({ userId, initialNickname, initialAvatarUrl, initialEmail }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // プロフィール
  const [nickname, setNickname] = useState(initialNickname)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)

  // メールアドレス
  const [email, setEmail] = useState(initialEmail)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // パスワード
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // アバターアップロード
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', '画像は2MB以下にしてください')
      return
    }

    setAvatarUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const url = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(url)

      // DBに保存
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      })
      if (!res.ok) throw new Error('保存に失敗しました')

      showMessage('success', 'アイコンを更新しました')
      router.refresh()
    } catch {
      showMessage('error', 'アップロードに失敗しました')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ニックネーム保存
  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      showMessage('error', '名前を入力してください')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })
      if (!res.ok) throw new Error()
      showMessage('success', '名前を更新しました')
      router.refresh()
    } catch {
      showMessage('error', '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メール変更
  const handleUpdateEmail = async () => {
    if (!email.trim() || email === initialEmail) return
    setSaving(true)
    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showMessage('success', data.message || '確認メールを送信しました')
      setShowEmailForm(false)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // パスワード変更
  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showMessage('error', 'パスワードは6文字以上にしてください')
      return
    }
    if (password !== passwordConfirm) {
      showMessage('error', 'パスワードが一致しません')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showMessage('success', 'パスワードを変更しました')
      setPassword('')
      setPasswordConfirm('')
      setShowPasswordForm(false)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* メッセージ */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* アイコン・名前 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">プロフィール</h3>

        {/* アバター */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="relative shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="アイコン"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {nickname[0] ?? '?'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center border border-gray-100">
              <span className="text-sm">📷</span>
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-gray-400">タップしてアイコンを変更<br />2MB以下のJPG/PNG</p>
        </div>

        {/* ニックネーム */}
        <label className="block text-xs text-gray-500 mb-1">表示名</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={handleSaveNickname}
            disabled={saving || nickname === initialNickname}
            className="px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      {/* アカウント設定 */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">アカウント設定</h3>

        {/* メールアドレス */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between py-2 cursor-pointer"
            onClick={() => setShowEmailForm(!showEmailForm)}
          >
            <div>
              <p className="text-sm text-gray-700">メールアドレス</p>
              <p className="text-xs text-gray-400 mt-0.5">{initialEmail}</p>
            </div>
            <span className="text-gray-300 text-sm">{showEmailForm ? '▼' : '→'}</span>
          </div>
          {showEmailForm && (
            <div className="mt-2 space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="新しいメールアドレス"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleUpdateEmail}
                disabled={saving || !email.trim() || email === initialEmail}
                className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                変更する
              </button>
              <p className="text-xs text-gray-400">確認メールが新しいアドレスに届きます</p>
            </div>
          )}
        </div>

        {/* パスワード */}
        <div>
          <div
            className="flex items-center justify-between py-2 cursor-pointer"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            <div>
              <p className="text-sm text-gray-700">パスワード変更</p>
              <p className="text-xs text-gray-400 mt-0.5">••••••••</p>
            </div>
            <span className="text-gray-300 text-sm">{showPasswordForm ? '▼' : '→'}</span>
          </div>
          {showPasswordForm && (
            <div className="mt-2 space-y-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="新しいパスワード（6文字以上）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="パスワードを再入力"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={saving || !password}
                className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                パスワードを変更
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
