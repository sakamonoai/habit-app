'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  groupId: string
  memberId: string
  challengeId?: string
  durationDays?: number
  checkinDeadline?: string | null
}

export default function CheckinForm({ groupId, memberId, challengeId, durationDays, checkinDeadline }: Props) {
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const startCamera = useCallback(async () => {
    setCameraError('')
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError('カメラにアクセスできません。カメラの権限を許可してください。')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
  }, [])

  const takePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setImageFile(file)
      setPreview(URL.createObjectURL(blob))
      stopCamera()
    }, 'image/jpeg', 0.85)
  }, [stopCamera])

  // 締め切り判定
  const isPassedDeadline = (() => {
    if (!checkinDeadline) return false
    const now = new Date()
    const [h, m] = checkinDeadline.split(':').map(Number)
    const todayDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    return now > todayDeadline
  })()

  const handleSubmit = async () => {
    if (isPassedDeadline) {
      setError(`本日の投稿締め切り（${checkinDeadline}）を過ぎています`)
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let imageUrl: string | null = null

    if (imageFile) {
      const ext = 'jpg'
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

    // バッジチェック
    if (challengeId && durationDays) {
      fetch('/api/badges/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, member_id: memberId, duration_days: durationDays }),
      }).catch(() => {})
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
        {isPassedDeadline ? (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">締切超過</span>
        ) : checkinDeadline ? (
          <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">{checkinDeadline}まで</span>
        ) : (
          <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full">未投稿</span>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}

      {/* カメラUI */}
      {cameraOpen ? (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-black">
          {cameraError ? (
            <div className="py-16 text-center">
              <p className="text-white text-sm mb-3">{cameraError}</p>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-white/20 text-white text-sm rounded-lg"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-xl"
              />
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-lg"
                >
                  ✕
                </button>
                <button
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-orange-400 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-full" />
                </button>
                <div className="w-12 h-12" />
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : preview ? (
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
          onClick={startCamera}
          className="w-full py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-all mb-3 active:scale-[0.98]"
        >
          <p className="text-4xl mb-2">📸</p>
          <p className="text-sm font-medium">タップしてカメラを起動</p>
          <p className="text-xs mt-1">その場で撮影してください</p>
        </button>
      )}

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
