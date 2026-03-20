'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  groupId: string
}

export default function CheckinForm({ groupId }: Props) {
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
        image_url: imageUrl,
        comment: comment || null,
      })

    if (checkinError) {
      setError('チェックインに失敗しました')
      setLoading(false)
      return
    }

    setComment('')
    setImageFile(null)
    setPreview(null)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">今日のチェックイン</h3>

      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}

      {/* 画像選択 */}
      {preview ? (
        <div className="relative mb-3">
          <img src={preview} alt="プレビュー" className="w-full rounded-xl object-cover max-h-48" />
          <button
            onClick={() => { setImageFile(null); setPreview(null) }}
            className="absolute top-2 right-2 bg-black/50 text-white w-7 h-7 rounded-full text-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors mb-3"
        >
          <p className="text-3xl mb-1">📸</p>
          <p className="text-sm">証拠写真を撮る</p>
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
        placeholder="コメント（任意）"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
      />

      {/* 送信ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading || !imageFile}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {loading ? '投稿中...' : 'チェックインする'}
      </button>
    </div>
  )
}
