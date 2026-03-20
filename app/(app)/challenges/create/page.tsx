'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { label: '運動', emoji: '🏃' },
  { label: '食習慣', emoji: '🥗' },
  { label: '生活', emoji: '📅' },
  { label: '勉強', emoji: '✏️' },
  { label: '趣味', emoji: '📚' },
]

const DURATION_OPTIONS = [
  { label: '7日間', value: 7 },
  { label: '14日間', value: 14 },
  { label: '21日間', value: 21 },
  { label: '30日間', value: 30 },
]

const MAX_MEMBERS_OPTIONS = [
  { label: '3人', value: 3 },
  { label: '5人', value: 5 },
  { label: '10人', value: 10 },
  { label: '30人', value: 30 },
  { label: '50人', value: 50 },
  { label: '無制限', value: 9999 },
]

export default function CreateChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const exampleRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [maxMembers, setMaxMembers] = useState(10)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [exampleFile, setExampleFile] = useState<File | null>(null)
  const [examplePreview, setExamplePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageSelect = (
    file: File | undefined,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void,
  ) => {
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File, userId: string, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('challenge-images')
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('challenge-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!category) { setError('カテゴリを選択してください'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 画像アップロード（並列）
    const [thumbnailUrl, examplePhotoUrl] = await Promise.all([
      thumbnailFile ? uploadImage(thumbnailFile, user.id, 'thumb') : Promise.resolve(null),
      exampleFile ? uploadImage(exampleFile, user.id, 'example') : Promise.resolve(null),
    ])

    const { data: challenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        duration_days: durationDays,
        deposit_amount: 1000,
        max_group_size: maxMembers,
        status: 'active',
        created_by: user.id,
        thumbnail_url: thumbnailUrl,
        example_photo_url: examplePhotoUrl,
      })
      .select('id')
      .single()

    if (createError) {
      setError(`作成に失敗しました: ${createError.message}`)
      setLoading(false)
      return
    }

    router.push(`/challenges/${challenge.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="font-semibold text-gray-900">チャレンジを作成</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* サムネイル画像 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">サムネイル画像（任意）</label>
          <input
            ref={thumbnailRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files?.[0], setThumbnailFile, setThumbnailPreview)}
          />
          <button
            onClick={() => thumbnailRef.current?.click()}
            className="w-full aspect-[2/1] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-orange-300 transition-colors"
          >
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="サムネイル" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-3xl mb-1">📷</span>
                <span className="text-sm text-gray-400">タップして画像を選択</span>
                <span className="text-xs text-gray-300 mt-0.5">チャレンジ一覧に表示されます</span>
              </>
            )}
          </button>
        </div>

        {/* タイトル */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：7日間 朝活チャレンジ"
            maxLength={50}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="チャレンジの内容やルールを説明してください"
            maxLength={200}
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/200</p>
        </div>

        {/* カテゴリ */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">カテゴリ</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.label)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  category === cat.label
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 期間 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">チャレンジ期間</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDurationDays(opt.value)}
                className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                  durationDays === opt.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 最大人数 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">最大参加人数</label>
          <div className="grid grid-cols-3 gap-2">
            {MAX_MEMBERS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMaxMembers(opt.value)}
                className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                  maxMembers === opt.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 報告例の画像 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">報告例の画像（任意）</label>
          <p className="text-xs text-gray-400 mb-2">参加者が「こんな写真を投稿すればOK」とわかる見本です</p>
          <input
            ref={exampleRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files?.[0], setExampleFile, setExamplePreview)}
          />
          <button
            onClick={() => exampleRef.current?.click()}
            className="w-full aspect-square max-w-[200px] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-orange-300 transition-colors"
          >
            {examplePreview ? (
              <img src={examplePreview} alt="報告例" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-3xl mb-1">📸</span>
                <span className="text-sm text-gray-400">見本画像を選択</span>
              </>
            )}
          </button>
        </div>

        {/* プレビュー */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-2">プレビュー</p>
          <div className="flex items-center gap-3">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-400 rounded-xl flex items-center justify-center text-2xl">
                {CATEGORIES.find(c => c.label === category)?.emoji ?? '🔥'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{title || 'タイトル未入力'}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">毎日</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{durationDays}日間</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {maxMembers >= 9999 ? '無制限' : `${maxMembers}人`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* 作成ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? '作成中...' : 'チャレンジを作成する'}
        </button>
      </main>
    </div>
  )
}
