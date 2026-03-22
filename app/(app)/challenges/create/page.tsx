'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe-client'
import { TRIAL_MODE } from '@/lib/trial-mode'

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

type DraftData = {
  id: string
  title: string
  description: string
  category: string
  scheduleType: 'flexible' | 'fixed'
  durationDays: number
  startDate: string
  endDate: string
  depositType: 'choosable' | 'fixed'
  fixedDeposit: number
  maxMembers: number | null
  hasDeadline: boolean
  deadlineTime: string
  checkinCondition: string
  updatedAt: string
}

const DRAFTS_KEY = 'challenge_drafts'

function loadDrafts(): DraftData[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveDrafts(drafts: DraftData[]) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)) } catch {}
}

export default function CreateChallengePage() {
  const router = useRouter()
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
  const [maxMembers, setMaxMembers] = useState<number | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [hasDeadline, setHasDeadline] = useState(false)
  const [deadlineTime, setDeadlineTime] = useState('23:59')
  const [checkinCondition, setCheckinCondition] = useState('')
  const [okPhotos, setOkPhotos] = useState<PhotoEntry[]>([])
  const [ngPhotos, setNgPhotos] = useState<PhotoEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [creatorDeposit, setCreatorDeposit] = useState(1000)
  const [draftSaved, setDraftSaved] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftData[]>([])
  const [showDraftList, setShowDraftList] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 旧形式の下書きを移行 + 下書き一覧を読み込み
  useEffect(() => {
    // 旧形式 (challenge_draft) があれば新形式に移行
    try {
      const oldDraft = localStorage.getItem('challenge_draft')
      if (oldDraft) {
        const d = JSON.parse(oldDraft)
        if (d.title) {
          const migrated: DraftData = {
            id: crypto.randomUUID(),
            title: d.title || '',
            description: d.description || '',
            category: d.category || '',
            scheduleType: d.scheduleType || 'flexible',
            durationDays: d.durationDays || 7,
            startDate: d.startDate || '',
            endDate: d.endDate || '',
            depositType: d.depositType || 'choosable',
            fixedDeposit: d.fixedDeposit || 1000,
            maxMembers: d.maxMembers || 10,
            hasDeadline: d.hasDeadline ?? false,
            deadlineTime: d.deadlineTime || '23:59',
            checkinCondition: d.checkinCondition || '',
            updatedAt: new Date().toISOString(),
          }
          const existing = loadDrafts()
          saveDrafts([migrated, ...existing])
          localStorage.removeItem('challenge_draft')
        }
      }
    } catch {}

    const loaded = loadDrafts()
    setDrafts(loaded)
    // 下書きがあれば選択画面を表示
    if (loaded.length > 0) {
      setShowDraftList(true)
    }
    setInitialized(true)
  }, [])

  const loadDraftIntoForm = (draft: DraftData) => {
    setTitle(draft.title)
    setDescription(draft.description)
    setCategory(draft.category)
    setScheduleType(draft.scheduleType)
    setDurationDays(draft.durationDays)
    setStartDate(draft.startDate)
    setEndDate(draft.endDate)
    setDepositType(draft.depositType)
    setFixedDeposit(draft.fixedDeposit)
    setMaxMembers(draft.maxMembers)
    setHasDeadline(draft.hasDeadline)
    setDeadlineTime(draft.deadlineTime)
    setCheckinCondition(draft.checkinCondition)
    setCurrentDraftId(draft.id)
    setShowDraftList(false)
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory(''); setScheduleType('flexible')
    setDurationDays(7); setStartDate(''); setEndDate(''); setDepositType('choosable')
    setFixedDeposit(1000); setMaxMembers(10); setHasDeadline(false)
    setDeadlineTime('23:59'); setCheckinCondition('')
    setThumbnailFile(null); setThumbnailPreview(null)
    setOkPhotos([]); setNgPhotos([])
    setCurrentDraftId(null)
  }

  // 下書き保存（新規or上書き）
  const saveDraft = useCallback(() => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    const draftData: DraftData = {
      id: currentDraftId || crypto.randomUUID(),
      title, description, category, scheduleType, durationDays,
      startDate, endDate, depositType, fixedDeposit, maxMembers,
      hasDeadline, deadlineTime, checkinCondition, updatedAt: now,
    }
    const existing = loadDrafts()
    let updated: DraftData[]
    if (currentDraftId) {
      updated = existing.map(d => d.id === currentDraftId ? draftData : d)
    } else {
      updated = [draftData, ...existing]
      setCurrentDraftId(draftData.id)
    }
    saveDrafts(updated)
    setDrafts(updated)
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }, [title, description, category, scheduleType, durationDays, startDate, endDate, depositType, fixedDeposit, maxMembers, hasDeadline, deadlineTime, checkinCondition, currentDraftId])

  const deleteDraft = (id: string) => {
    const updated = loadDrafts().filter(d => d.id !== id)
    saveDrafts(updated)
    setDrafts(updated)
    if (currentDraftId === id) setCurrentDraftId(null)
    if (updated.length === 0) setShowDraftList(false)
  }

  const clearDraft = () => {
    if (currentDraftId) {
      deleteDraft(currentDraftId)
    }
  }

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
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
    const { error } = await supabase.storage.from('challenge-images').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('challenge-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handlePreSubmit = () => {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!description.trim()) { setError('説明を入力してください'); return }
    if (!checkinCondition.trim()) { setError('記録成功条件を入力してください'); return }
    if (!category) { setError('カテゴリを選択してください'); return }
    if (!maxMembers) { setError('最大参加人数を選択してください'); return }
    if (scheduleType === 'fixed') {
      if (!startDate || !endDate) { setError('開始日と終了日を選択してください'); return }
      if (new Date(startDate) < new Date(new Date().toISOString().split('T')[0])) { setError('開始日は今日以降を選択してください'); return }
      if (new Date(endDate) <= new Date(startDate)) { setError('終了日は開始日より後を選択してください'); return }
      if (computedDurationDays > MAX_DURATION_DAYS) { setError(`チャレンジ期間は最大${MAX_DURATION_DAYS}日間です`); return }
    }
    setError('')
    setShowConfirm(true)
  }

  // 画像アップロード + チャレンジデータを構築
  const buildChallengeData = async (userId: string) => {
    const thumbnailUrl = thumbnailFile ? await uploadImage(thumbnailFile, userId, 'thumb') : null

    const okUploaded = await Promise.all(
      okPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, userId, 'ok'),
        desc: p.desc.trim(),
      }))
    )
    const ngUploaded = await Promise.all(
      ngPhotos.filter(p => p.file).map(async (p) => ({
        url: await uploadImage(p.file!, userId, 'ng'),
        desc: p.desc.trim(),
      }))
    )

    const okPhotoData = okUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))
    const ngPhotoData = ngUploaded.filter(p => p.url).map(p => ({ url: p.url, desc: p.desc }))

    return {
      title: title.trim(),
      description: description.trim() || null,
      category,
      schedule_type: scheduleType,
      duration_days: computedDurationDays,
      start_date: scheduleType === 'fixed' ? startDate : null,
      end_date: scheduleType === 'fixed' ? endDate : null,
      deposit_type: depositType,
      deposit_amount: depositType === 'fixed' ? fixedDeposit : 1000,
      max_group_size: maxMembers!,
      thumbnail_url: thumbnailUrl,
      checkin_deadline: hasDeadline ? deadlineTime : null,
      checkin_condition: checkinCondition.trim() || null,
      ok_photo_url: okPhotoData.length > 0 ? JSON.stringify(okPhotoData) : null,
      ng_photo_url: ngPhotoData.length > 0 ? JSON.stringify(ngPhotoData) : null,
    }
  }

  // お試しモード: Stripeなしで直接作成+参加
  const handleTrialCreate = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // 画像アップロード + データ構築
      const challengeData = await buildChallengeData(user.id)

      // チャレンジ作成
      const { data: newChallenge, error: createError } = await supabase
        .from('challenges')
        .insert({ ...challengeData, created_by: user.id, status: 'active' })
        .select('id')
        .single()

      if (createError) throw new Error(`作成失敗: ${createError.message}`)

      // グループ作成
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({ challenge_id: newChallenge.id })
        .select('id')
        .single()

      if (groupError) throw new Error(`グループ作成失敗: ${groupError.message}`)

      // 作成者を参加者として追加（デポジットなし）
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
          challenge_id: newChallenge.id,
          deposit_amount: 0,
          deposit_payment_intent_id: null,
          fee_payment_intent_id: null,
          status: 'active',
        })

      if (joinError) throw new Error(`参加失敗: ${joinError.message}`)

      clearDraft()
      router.push(`/group/${newGroup.id}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
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
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600 shrink-0">
            ← 戻る
          </Link>
          <h1 className="font-semibold text-gray-900 flex-1">チャレンジを作成</h1>
          {drafts.length > 0 && (
            <button
              onClick={() => setShowDraftList(true)}
              className="text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors shrink-0"
            >
              下書き({drafts.length})
            </button>
          )}
          <button
            onClick={saveDraft}
            className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors shrink-0"
          >
            {draftSaved ? '✓ 保存済み' : '下書き保存'}
          </button>
        </div>
      </header>

      {/* 下書き一覧モーダル */}
      {showDraftList && drafts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full animate-slide-up max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-gray-900 text-center mb-1">下書きがあります</h3>
            <p className="text-xs text-gray-400 text-center mb-4">続きを編集するか、新規作成を選んでください</p>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  <button
                    onClick={() => loadDraftIntoForm(draft)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold text-sm text-gray-900 truncate">{draft.title || '無題の下書き'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {draft.category && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">{draft.category}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(draft.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                    aria-label="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => { resetForm(); setShowDraftList(false) }}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
            >
              新規作成
            </button>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6 pb-40 space-y-5">
        {/* 下書き編集中バナー */}
        {currentDraftId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-blue-700">下書きを編集中</p>
            <button
              onClick={() => { resetForm() }}
              className="text-xs text-blue-500 font-medium hover:text-blue-700"
            >
              新規に切り替え
            </button>
          </div>
        )}
        {/* 下書きがあるとき表示 */}
        {initialized && !showDraftList && drafts.length > 0 && !currentDraftId && (
          <button
            onClick={() => setShowDraftList(true)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 hover:bg-gray-100 transition-colors text-left"
          >
            下書き一覧を見る（{drafts.length}件）
          </button>
        )}
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
          <p className="text-xs text-gray-400 mt-1.5">
            いい画像がない場合は<a href="https://unsplash.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Unsplash</a>をご活用ください（無料で商用利用可）
          </p>
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
          <label className="block text-sm font-semibold text-gray-900 mb-2">説明 <span className="text-red-400">*</span></label>
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
              <p className="text-xs text-gray-500">参加した日からカウント開始。新しい人が入りやすい。（全員の期間終了後に削除可能）</p>
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

        {/* 投稿締め切り時間 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">記録の締め切り時間（任意）</label>
          <p className="text-xs text-gray-400 mb-3">毎日の記録投稿に締め切りを設ける場合に設定</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setHasDeadline(false)}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                !hasDeadline
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900">締め切りなし</p>
              <p className="text-xs text-gray-500 mt-0.5">23:59まで投稿OK</p>
            </button>
            <button
              onClick={() => setHasDeadline(true)}
              className={`p-4 rounded-xl text-left transition-colors border-2 ${
                hasDeadline
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900">⏰ 締め切りあり</p>
              <p className="text-xs text-gray-500 mt-0.5">時間を指定する</p>
            </button>
          </div>
          {hasDeadline && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">締め切り時刻</label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <p className="text-sm text-gray-600">までに投稿</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">例: 朝活チャレンジなら「09:00」</p>
            </div>
          )}
        </div>

        {/* 記録成功条件 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">記録成功条件 <span className="text-red-400">*</span></label>
          <p className="text-xs text-gray-400 mb-2">チェックインが認められる条件を書いてください</p>
          <textarea
            value={checkinCondition}
            onChange={(e) => setCheckinCondition(e.target.value)}
            placeholder={"例：\n・ランニングウェアを着て走っている写真\n・30分以上のランニングが確認できること"}
            maxLength={500}
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{checkinCondition.length}/500</p>
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
                  {maxMembers ? (maxMembers >= 9999 ? '無制限' : `${maxMembers}人`) : '未選択'}
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
      </main>

      {/* 作成ボタン（固定表示） */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+max(env(safe-area-inset-bottom),8px))]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handlePreSubmit}
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? '処理中...' : '作成して参加する'}
          </button>
        </div>
      </div>

      {/* 確認ポップアップ */}
      {showConfirm && TRIAL_MODE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">作成して参加する</h3>
              <p className="text-xs text-gray-400 mt-1">作成者も参加者としてチャレンジに挑戦します</p>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">デポジット</p>
                <p className="text-xl font-bold text-green-600">¥0（無料）</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-sm text-gray-600">
                  お試しキャンペーン中のため、デポジットなし・カード登録不要で作成&参加できます。
                </p>
              </div>
              <p className="text-xs text-gray-400 text-center">
                ※ 正式リリース後はデポジット制になります
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                戻る
              </button>
              <button
                onClick={handleTrialCreate}
                disabled={loading}
                className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? '作成中...' : '作成する（無料）'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通常モード: デポジット選択 + 確認 */}
      {showConfirm && !TRIAL_MODE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">💪</div>
              <h3 className="text-lg font-bold text-gray-900">作成して参加する</h3>
              <p className="text-xs text-gray-400 mt-1">作成者も参加者としてチャレンジに挑戦します</p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">あなたのデポジット金額</p>
              <div className="grid grid-cols-3 gap-2">
                {FIXED_DEPOSIT_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCreatorDeposit(amount)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      creatorDeposit === amount
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ¥{amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">デポジット（仮押さえ）</span>
                <span className="font-semibold text-gray-900">¥{creatorDeposit.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm">
                <span className="text-gray-600">今回の引き落とし</span>
                <span className="font-bold text-green-600">¥0（無料）</span>
              </div>
              <p className="text-xs text-gray-400">
                デポジットはカードに仮押さえされますが、85%以上達成で引き落とされません。
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs text-red-500 font-medium">
                達成率85%未満の場合、デポジット（¥{creatorDeposit.toLocaleString()}）は返金されません。
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
                onClick={() => { setShowConfirm(false); setShowPayment(true) }}
                className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98]"
              >
                次へ（カード入力）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通常モード: カード入力 */}
      {showPayment && !TRIAL_MODE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-bold text-gray-900 text-center mb-1">カード情報を入力</h3>
            <p className="text-xs text-gray-400 text-center mb-4">決済完了でチャレンジが作成されます</p>
            <Elements stripe={stripePromise}>
              <CreatePaymentForm
                depositAmount={creatorDeposit}
                buildChallengeData={buildChallengeData}
                onSuccess={(groupId) => { clearDraft(); router.push(`/group/${groupId}`); router.refresh() }}
                onCancel={() => setShowPayment(false)}
                onError={(msg) => { setError(msg); setShowPayment(false) }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}

// --- 通常モード用: カード入力 + 決済 + チャレンジ作成フォーム ---
function CreatePaymentForm({
  depositAmount,
  buildChallengeData,
  onSuccess,
  onCancel,
  onError,
}: {
  depositAmount: number
  buildChallengeData: (userId: string) => Promise<Record<string, unknown>>
  onSuccess: (groupId: string) => void
  onCancel: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'uploading' | 'processing' | 'done'>('input')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      setStep('processing')
      const setupRes = await fetch('/api/stripe/setup-intent', { method: 'POST' })
      const setupData = await setupRes.json()
      if (!setupRes.ok) throw new Error(setupData.error || 'SetupIntentの作成に失敗しました')

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('カード情報が入力されていません')

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        { payment_method: { card: cardElement } }
      )
      if (confirmError) throw new Error(confirmError.message || 'カード認証に失敗しました')
      if (!setupIntent?.payment_method) throw new Error('支払い方法の保存に失敗しました')

      setStep('uploading')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('認証が必要です')

      const challengeData = await buildChallengeData(user.id)

      setStep('processing')
      const res = await fetch('/api/stripe/confirm-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeData, depositAmount, paymentMethodId: setupIntent.payment_method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'チャレンジ作成に失敗しました')

      setStep('done')
      onSuccess(data.groupId)
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(message)
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">デポジット（仮押さえ）</span>
            <span className="font-semibold text-gray-900">¥{depositAmount.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm">
            <span className="text-gray-600">今回の引き落とし</span>
            <span className="font-bold text-green-600">¥0（無料）</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カード情報</label>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <CardElement
              options={{
                style: {
                  base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
                  invalid: { color: '#ef4444' },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {(step === 'uploading' || step === 'processing') && (
          <div className="text-center py-2">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-2">
              {step === 'uploading' ? '画像アップロード中...' : '決済処理中...'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
            戻る
          </button>
          <button type="submit" disabled={loading || !stripe}
            className="flex-[2] py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]">
            {loading ? '処理中...' : '作成して参加する'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          カード情報はStripeにより安全に管理されます。
        </p>
      </div>
    </form>
  )
}
