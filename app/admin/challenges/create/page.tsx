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
  { label: 'その他', emoji: '🔥' },
]

const MAX_DURATION_DAYS = 21

const DURATION_OPTIONS = [
  { label: '7日間', value: 7 },
  { label: '14日間', value: 14 },
  { label: '21日間', value: 21 },
]

const FIXED_DEPOSIT_OPTIONS = [500, 1000, 2000, 3000, 5000, 10000]

const MAX_MEMBERS_OPTIONS = [
  { label: '3人', value: 3 },
  { label: '5人', value: 5 },
  { label: '10人', value: 10 },
  { label: '30人', value: 30 },
  { label: '50人', value: 50 },
  { label: '100人', value: 100 },
  { label: '無制限', value: 9999 },
]

type PhotoEntry = {
  file: File | null
  preview: string | null
  desc: string
}

export default function AdminCreateChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const okRefs = useRef<(HTMLInputElement | null)[]>([])
  const ngRefs = useRef<(HTMLInputElement | null)[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [scheduleType, setScheduleType] = useState<'flexible' | 'fixed'>('flexible')
  const [durationDays, setDurationDays] = useState(7)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [depositType, setDepositType] = useState<'choosable' | 'fixed'>('choosable')
  const [fixedDeposit, setFixedDeposit] = useState(1000)
  const [maxMembers, setMaxMembers] = useState(10)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [okPhotos, setOkPhotos] = useState<PhotoEntry[]>([])
  const [ngPhotos, setNgPhotos] = useState<PhotoEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const computedDurationDays = scheduleType === 'fixed' && startDate && endDate
    ? Math.max(Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1, 1)
    : durationDays

  const handleImageSelect = (file: File | undefined, onSelect: (f: File, preview: string) => void) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => onSelect(file, e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const addPhoto = (type: 'ok' | 'ng') => {
    const setter = type === 'ok' ? setOkPhotos : setNgPhotos
    setter(prev => [...prev, { file: null, preview: null, desc: '' }])
  }

  const updatePhoto = (type: 'ok' | 'ng', index: number, updates: Partial<PhotoEntry>) => {
    const setter = type === 'ok' ? setOkPhotos : setNgPhotos
    setter(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p))
  }

  const removePhoto = (type: 'ok' | 'ng', index: number) => {
    const setter = type === 'ok' ? setOkPhotos : setNgPhotos
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (file: File, userId: string, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
    const { error } = await supabase.storage.from('challenge-images').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('challenge-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!category) { setError('カテゴリを選択してください'); return }
    if (scheduleType === 'fixed') {
      if (!startDate || !endDate) { setError('開始日と終了日を選択してください'); return }
      if (new Date(startDate) < new Date(new Date().toISOString().split('T')[0])) { setError('開始日は今日以降を選択してください'); return }
      if (new Date(endDate) <= new Date(startDate)) { setError('終了日は開始日より後を選択してください'); return }
      if (computedDurationDays > MAX_DURATION_DAYS) { setError(`チャレンジ期間は最大${MAX_DURATION_DAYS}日間です`); return }
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 画像アップロード
    const thumbnailUrl = thumbnailFile ? await uploadImage(thumbnailFile, user.id, 'official-thumb') : null

    const okUploaded = await Promise.all(
      okPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, user.id, 'official-ok'),
        desc: p.desc.trim(),
      }))
    )
    const ngUploaded = await Promise.all(
      ngPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, user.id, 'official-ng'),
        desc: p.desc.trim(),
      }))
    )

    const okPhotoData = okUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))
    const ngPhotoData = ngUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))

    const res = await fetch('/api/admin/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        category,
        scheduleType,
        durationDays: computedDurationDays,
        startDate: scheduleType === 'fixed' ? startDate : null,
        endDate: scheduleType === 'fixed' ? endDate : null,
        depositType,
        depositAmount: depositType === 'fixed' ? fixedDeposit : 1000,
        maxMembers,
        thumbnailUrl,
        okPhotoUrl: okPhotoData.length > 0 ? JSON.stringify(okPhotoData) : null,
        ngPhotoUrl: ngPhotoData.length > 0 ? JSON.stringify(ngPhotoData) : null,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(`作成に失敗しました: ${result.error}`)
      setLoading(false)
      return
    }

    router.push('/admin/challenges')
  }

  const renderPhotoSection = (type: 'ok' | 'ng', photos: PhotoEntry[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const isOk = type === 'ok'
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {isOk ? 'OK例' : 'NG例'}の写真（任意）
        </label>
        <p className="text-xs text-gray-400 mb-3">
          {isOk ? '「こんな写真ならOK」という見本' : '「こんな写真はNG」という見本'}
        </p>
        <div className="space-y-3">
          {photos.map((photo, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex gap-3">
                <div>
                  <input
                    ref={(el) => { refs.current[i] = el }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleImageSelect(e.target.files?.[0], (file, preview) => {
                        updatePhoto(type, i, { file, preview })
                      })
                    }}
                  />
                  <button
                    onClick={() => refs.current[i]?.click()}
                    className="w-24 h-24 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  >
                    {photo.preview ? (
                      <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-300">📷</span>
                    )}
                  </button>
                </div>
                <div className="flex-1 flex flex-col">
                  <input
                    type="text"
                    value={photo.desc}
                    onChange={(e) => updatePhoto(type, i, { desc: e.target.value })}
                    placeholder={isOk ? 'OK例の説明' : 'NG例の説明'}
                    maxLength={80}
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                  />
                  <button
                    onClick={() => removePhoto(type, i)}
                    className="text-xs text-gray-400 hover:text-red-500 mt-auto self-end transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => addPhoto(type)}
          className={`mt-2 w-full py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-colors ${
            isOk
              ? 'border-green-200 text-green-500 hover:bg-green-50'
              : 'border-red-200 text-red-400 hover:bg-red-50'
          }`}
        >
          + {isOk ? 'OK例' : 'NG例'}を追加
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/challenges" className="text-gray-400 hover:text-gray-600">← 戻る</Link>
        <h1 className="text-xl font-bold text-gray-900">公式チャレンジを作成</h1>
        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">公式</span>
      </div>

      <div className="space-y-5">
        {/* サムネイル */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">サムネイル画像（任意）</label>
          <input
            ref={thumbnailRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files?.[0], (file, preview) => {
              setThumbnailFile(file)
              setThumbnailPreview(preview)
            })}
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
            placeholder="例：【公式】7日間 朝活チャレンジ"
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
            maxLength={500}
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
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

        {/* スケジュールタイプ */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">期間タイプ</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScheduleType('flexible')}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                scheduleType === 'flexible'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900 mb-1">いつでも参加</p>
              <p className="text-xs text-gray-500">参加した日からカウント開始</p>
            </button>
            <button
              onClick={() => setScheduleType('fixed')}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                scheduleType === 'fixed'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900 mb-1">期間を決める</p>
              <p className="text-xs text-gray-500">全員同じ日程で走る</p>
            </button>
          </div>
        </div>

        {/* 期間設定 */}
        {scheduleType === 'flexible' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">チャレンジ期間</label>
            <div className="grid grid-cols-3 gap-2">
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
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">開始日</label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">終了日</label>
              <input
                type="date"
                value={endDate}
                min={startDate || new Date().toISOString().split('T')[0]}
                max={startDate ? new Date(new Date(startDate).getTime() + (MAX_DURATION_DAYS - 1) * 86400000).toISOString().split('T')[0] : undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <p className="text-xs text-gray-400 mt-1">最大{MAX_DURATION_DAYS}日間まで</p>
            </div>
            {startDate && endDate && (
              <div className="bg-orange-50 rounded-xl px-4 py-3">
                <p className="text-sm text-orange-700 font-medium">
                  {new Date(startDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                  〜{new Date(endDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                  （{computedDurationDays}日間）
                </p>
              </div>
            )}
          </div>
        )}

        {/* 最大人数 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">最大参加人数</label>
          <div className="grid grid-cols-4 gap-2">
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

        {/* デポジット設定 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">デポジット金額</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setDepositType('choosable')}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                depositType === 'choosable'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900 mb-1">挑戦者が選ぶ</p>
              <p className="text-xs text-gray-500">参加時に自分で金額を選択</p>
            </button>
            <button
              onClick={() => setDepositType('fixed')}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                depositType === 'fixed'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900 mb-1">金額を固定</p>
              <p className="text-xs text-gray-500">全員同じ金額で参加</p>
            </button>
          </div>
          {depositType === 'fixed' && (
            <div className="grid grid-cols-3 gap-2">
              {FIXED_DEPOSIT_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setFixedDeposit(amount)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                    fixedDeposit === amount
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OK例 */}
        {renderPhotoSection('ok', okPhotos, okRefs)}

        {/* NG例 */}
        {renderPhotoSection('ng', ngPhotos, ngRefs)}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? '作成中...' : '公式チャレンジを作成する'}
        </button>
      </div>
    </div>
  )
}
