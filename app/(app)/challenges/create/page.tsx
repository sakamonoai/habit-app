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

const MAX_DURATION_DAYS = 21 // Stripeオーソリ保持期限（30日）内に収めるため

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
  { label: '無制限', value: 9999 },
]

type PhotoEntry = {
  file: File | null
  preview: string | null
  desc: string
}

export default function CreateChallengePage() {
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
  const [showConfirm, setShowConfirm] = useState(false)

  // 固定期間の場合、開始日・終了日からduration_daysを計算
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

  const handlePreSubmit = () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!category) { setError('カテゴリを選択してください'); return }
    if (scheduleType === 'fixed') {
      if (!startDate || !endDate) { setError('開始日と終了日を選択してください'); return }
      if (new Date(startDate) < new Date(new Date().toISOString().split('T')[0])) { setError('開始日は今日以降を選択してください'); return }
      if (new Date(endDate) <= new Date(startDate)) { setError('終了日は開始日より後を選択してください'); return }
      if (computedDurationDays > MAX_DURATION_DAYS) { setError(`チャレンジ期間は最大${MAX_DURATION_DAYS}日間です`); return }
    }
    setError('')
    setShowConfirm(true)
  }

  const handleSubmit = async () => {
    setShowConfirm(false)
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 画像アップロード
    const thumbnailUrl = thumbnailFile ? await uploadImage(thumbnailFile, user.id, 'thumb') : null

    // OK/NG写真をアップロード
    const okUploaded = await Promise.all(
      okPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, user.id, 'ok'),
        desc: p.desc.trim(),
      }))
    )
    const ngUploaded = await Promise.all(
      ngPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, user.id, 'ng'),
        desc: p.desc.trim(),
      }))
    )

    // OK/NG写真データをJSON化
    const okPhotoData = okUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))
    const ngPhotoData = ngUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))

    const { data: challenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        schedule_type: scheduleType,
        duration_days: computedDurationDays,
        start_date: scheduleType === 'fixed' ? startDate : null,
        end_date: scheduleType === 'fixed' ? endDate : null,
        deposit_type: depositType,
        deposit_amount: depositType === 'fixed' ? fixedDeposit : 1000,
        max_group_size: maxMembers,
        status: 'active',
        created_by: user.id,
        thumbnail_url: thumbnailUrl,
        ok_photo_url: okPhotoData.length > 0 ? JSON.stringify(okPhotoData) : null,
        ng_photo_url: ngPhotoData.length > 0 ? JSON.stringify(ngPhotoData) : null,
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

  const renderPhotoSection = (type: 'ok' | 'ng', photos: PhotoEntry[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const isOk = type === 'ok'
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {isOk ? 'OK例' : 'NG例'}の写真（任意）
        </label>
        <p className="text-xs text-gray-400 mb-3">
          {isOk ? '「こんな写真ならOK」という見本です' : '「こんな写真はNG」という見本です'}
        </p>

        <div className="space-y-3">
          {photos.map((photo, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex gap-3">
                {/* 画像選択 */}
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
                {/* 説明 + 削除 */}
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
              <p className="text-xs text-gray-500">参加した日からカウント開始。新しい人が入りやすい。（いつでも削除できます）</p>
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
              <p className="text-xs text-gray-500">全員同じ日程で走る。皆で一緒に達成感を味わえる。</p>
            </button>
          </div>
        </div>

        {/* 期間設定 */}
        {scheduleType === 'flexible' ? (
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
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">開始日</label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{computedDurationDays}日間</span>
                {scheduleType === 'fixed' && startDate && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                    {new Date(startDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}〜
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {maxMembers >= 9999 ? '無制限' : `${maxMembers}人`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ガイドライン */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">チャレンジ作成ガイドライン</h3>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>違法行為・危険行為を促すチャレンジ</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>差別的・暴力的・性的な内容を含むチャレンジ</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>詐欺やスパム目的のチャレンジ</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <span>他人のプライバシーを侵害するチャレンジ</span>
            </li>
          </ul>
          <p className="text-xs text-yellow-700 mt-2 font-medium">
            ガイドラインに違反するチャレンジは、運営により予告なく非公開にされる場合があります。
          </p>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handlePreSubmit}
          disabled={loading}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? '作成中...' : 'チャレンジを作成する'}
        </button>

        {/* 確認ポップアップ */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-bold text-gray-900">本当に作成しますか？</h3>
              </div>
              <div className="space-y-2 mb-5">
                <p className="text-sm text-gray-600">
                  一度チャレンジを作成すると、以下の条件を満たすまで削除できません：
                </p>
                <ul className="text-sm text-gray-700 space-y-1.5 bg-gray-50 rounded-xl p-3">
                  <li className="flex gap-2">
                    <span className="text-orange-500 shrink-0">1.</span>
                    <span>チャレンジ期限が終了している</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500 shrink-0">2.</span>
                    <span>誰もそのチャレンジに挑戦していない</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-400">
                  ※ 両方の条件を満たすまで削除できません。内容をよく確認してから作成してください。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
                >
                  作成する
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
