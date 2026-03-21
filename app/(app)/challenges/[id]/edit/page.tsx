'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type PhotoItem = { url: string; desc: string }

export default function ChallengeEditPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')

  // 編集可能フィールド
  const [checkinCondition, setCheckinCondition] = useState('')
  const [okPhotos, setOkPhotos] = useState<PhotoItem[]>([])
  const [ngPhotos, setNgPhotos] = useState<PhotoItem[]>([])

  const okFileRef = useRef<HTMLInputElement>(null)
  const ngFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: challenge }, { data: profile }] = await Promise.all([
        supabase
          .from('challenges')
          .select('title, created_by, is_official, checkin_condition, ok_photo_url, ng_photo_url')
          .eq('id', id)
          .single(),
        supabase.from('profiles').select('role').eq('id', user.id).single(),
      ])

      const isCreator = challenge?.created_by === user.id
      const isAdminOfOfficial = challenge?.is_official && profile?.role === 'admin'
      if (!challenge || (!isCreator && !isAdminOfOfficial)) {
        router.push(`/challenges/${id}`)
        return
      }

      setTitle(challenge.title)
      setCheckinCondition(challenge.checkin_condition ?? '')
      try { setOkPhotos(challenge.ok_photo_url ? JSON.parse(challenge.ok_photo_url) : []) } catch { setOkPhotos([]) }
      try { setNgPhotos(challenge.ng_photo_url ? JSON.parse(challenge.ng_photo_url) : []) } catch { setNgPhotos([]) }
      setLoading(false)
    }
    load()
  }, [id, supabase, router])

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `challenges/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('checkin-images')
      .upload(filePath, file)

    if (error) return null

    const { data } = supabase.storage
      .from('checkin-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleAddPhoto = async (type: 'ok' | 'ng', file: File) => {
    const url = await uploadPhoto(file)
    if (!url) { setError('画像のアップロードに失敗しました'); return }

    const item: PhotoItem = { url, desc: '' }
    if (type === 'ok') {
      setOkPhotos(prev => [...prev, item])
    } else {
      setNgPhotos(prev => [...prev, item])
    }
  }

  const removePhoto = (type: 'ok' | 'ng', index: number) => {
    if (type === 'ok') {
      setOkPhotos(prev => prev.filter((_, i) => i !== index))
    } else {
      setNgPhotos(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updatePhotoDesc = (type: 'ok' | 'ng', index: number, desc: string) => {
    if (type === 'ok') {
      setOkPhotos(prev => prev.map((p, i) => i === index ? { ...p, desc } : p))
    } else {
      setNgPhotos(prev => prev.map((p, i) => i === index ? { ...p, desc } : p))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        checkin_condition: checkinCondition.trim() || null,
        ok_photo_url: okPhotos.length > 0 ? JSON.stringify(okPhotos) : null,
        ng_photo_url: ngPhotos.length > 0 ? JSON.stringify(ngPhotos) : null,
      })
      .eq('id', id)

    if (updateError) {
      setError('保存に失敗しました')
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push(`/challenges/${id}`), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/challenges/${id}`} className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="font-semibold text-gray-900 truncate">条件を編集</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-6">「{title}」の記録条件を編集</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-green-700 font-semibold">保存しました！</p>
          </div>
        )}

        {/* 記録成功条件 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            📋 記録成功条件
          </label>
          <textarea
            value={checkinCondition}
            onChange={(e) => setCheckinCondition(e.target.value)}
            placeholder="例：筋トレをしている様子が分かる写真を投稿してください。ジムの入館証でもOKです。"
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
          />
        </div>

        {/* OK例写真 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            ✅ OK例の写真
          </label>
          <div className="space-y-3">
            {okPhotos.map((photo, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                  <Image src={photo.url} alt={`OK例${i + 1}`} fill className="object-cover" sizes="80px" />
                  <button
                    onClick={() => removePhoto('ok', i)}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={photo.desc}
                  onChange={(e) => updatePhotoDesc('ok', i, e.target.value)}
                  placeholder="説明（任意）"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ))}
          </div>
          <input
            ref={okFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleAddPhoto('ok', file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => okFileRef.current?.click()}
            className="mt-3 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-500 transition-all text-sm"
          >
            + OK例を追加
          </button>
        </div>

        {/* NG例写真 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            ❌ NG例の写真
          </label>
          <div className="space-y-3">
            {ngPhotos.map((photo, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                  <Image src={photo.url} alt={`NG例${i + 1}`} fill className="object-cover" sizes="80px" />
                  <button
                    onClick={() => removePhoto('ng', i)}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={photo.desc}
                  onChange={(e) => updatePhotoDesc('ng', i, e.target.value)}
                  placeholder="説明（任意）"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ))}
          </div>
          <input
            ref={ngFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleAddPhoto('ng', file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => ngFileRef.current?.click()}
            className="mt-3 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-red-300 hover:text-red-500 transition-all text-sm"
          >
            + NG例を追加
          </button>
        </div>

        {/* 注意書き */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-yellow-700">
            ※ タイトル・期間・デポジット金額などは変更できません。記録条件とOK/NG例の写真のみ編集可能です。
          </p>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving || success}
          className="w-full py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {saving ? '保存中...' : '変更を保存する'}
        </button>
      </main>
    </div>
  )
}
