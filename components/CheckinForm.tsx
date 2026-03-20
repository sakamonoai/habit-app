'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  groupId: string
  memberId: string
}

export default function CheckinForm({ groupId, memberId }: Props) {
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let imageUrl: string | null = null

    // 画像アップロード
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filePath = `checkins/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('checkin-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setError('画像のアップロードに失敗しました')
        setLoading(false)
        return
      }

      const { data: publicUrl } = supabase.storage
        .from('checkin-images')
        .getPublicUrl(filePath)

      imageUrl = publicUrl.publicUrl
    }

    // チェックイン作成
    const { error: checkinError } = await supabase
      .from('checkins')
      .insert({
        group_id: groupId,
        user_id: user.id,
        member_id: memberId,
        photo_url: imageUrl,
        comment: comment || null,
      })

    if (checkinError) {
      setError('チェックインに失敗しました')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.refresh()
    }, 1500)
  }

  if (success) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-green-800 font-bold text-lg">今日もやりきった！</p>
        <p className="text-green-600 text-sm mt-1">連続記録を伸ばしていこう</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">今日の記録</h3>
        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">未投稿</span>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}

      {/* 画像選択 */}
      {preview ? (
        <div className="relative mb-3">
          <img src={preview} alt="プレビュー" className="w-full rounded-xl object-cover max-h-48" />
          <button
            onClick={() => { setImageFile(null); setPreview(null) }}
            className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-all mb-3 active:scale-[0.98]"
        >
          <p className="text-4xl mb-2">📸</p>
          <p className="text-sm font-medium">タップして写真を撮る</p>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* コメント */}
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="ひとこと（任意）"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent mb-3"
      />

      {/* 送信ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading || !imageFile}
        className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-all active:scale-[0.98]"
      >
        {loading ? '投稿中...' : '記録を投稿する'}
      </button>
    </div>
  )
}
