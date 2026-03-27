'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckinShareCard from '@/components/CheckinShareCard'

type Props = {
  groupId: string
  memberId: string
  challengeId?: string
  durationDays?: number
  checkinDeadline?: string | null
  challengeTitle?: string
}

export default function CheckinForm({ groupId, memberId, challengeId, durationDays, checkinDeadline, challengeTitle }: Props) {
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkinCount, setCheckinCount] = useState(0)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // コンポーネントのアンマウント時にのみストリームを完全停止
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startCamera = useCallback(async (mode?: 'environment' | 'user') => {
    const targetMode = mode ?? facingMode
    setCameraError('')
    setCameraOpen(true)

    // 既存ストリームを完全停止してからリセット
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Permissions API で事前に権限状態を確認（対応ブラウザのみ）
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (result.state === 'denied') {
          setPermissionDenied(true)
          setCameraError('カメラの権限が拒否されています。端末の設定からカメラへのアクセスを許可してください。')
          return
        }
      }
    } catch {
      // permissions.query 非対応（iOS Safari など）— そのまま続行
    }

    try {
      // exact で強制指定し、失敗時は ideal にフォールバック（iOS Safari対策）
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: targetMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
      }
      streamRef.current = stream
      setPermissionDenied(false)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionDenied(true)
        setCameraError('カメラの権限が拒否されています。端末の設定アプリからカメラへのアクセスを許可してください。')
      } else {
        setCameraError('カメラにアクセスできません。デバイスにカメラが接続されているか確認してください。')
      }
    }
  }, [facingMode])

  const toggleCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    startCamera(newMode)
  }, [facingMode, startCamera])

  // カメラUIを閉じる（ストリームは維持）
  const hideCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setCountdown(null)
    setCameraOpen(false)
  }, [])

  // ストリームを完全に停止してカメラを閉じる
  const stopCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setCountdown(null)
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

    // インカメ時はミラー反転して撮影（プレビューの見た目と一致させる）
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setImageFile(file)
      setPreview(URL.createObjectURL(blob))
      hideCamera()
    }, 'image/jpeg', 0.85)
  }, [facingMode, hideCamera])

  const handleShutter = useCallback(() => {
    if (timerSeconds === 0) {
      takePhoto()
      return
    }
    // タイマー開始
    setCountdown(timerSeconds)
    let remaining = timerSeconds
    timerRef.current = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        setCountdown(null)
        takePhoto()
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }, [timerSeconds, takePhoto])

  // 締め切り判定
  const isPassedDeadline = (() => {
    if (!checkinDeadline) return false
    const now = new Date()
    const [h, m] = checkinDeadline.split(':').map(Number)
    const todayDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    return now > todayDeadline
  })()

  const handleSubmit = async () => {
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
      setError('記録に失敗しました')
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

    // チェックイン数を取得
    if (memberId) {
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId)
      setCheckinCount(count ?? 1)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <CheckinShareCard
        checkinCount={checkinCount}
        durationDays={durationDays ?? 21}
        challengeTitle={challengeTitle ?? 'チャレンジ'}
      />
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

      {/* カメラUI（全画面オーバーレイ） */}
      {cameraOpen ? (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-white text-sm mb-3">{cameraError}</p>
              {permissionDenied && (
                <p className="text-white/60 text-xs mb-3 px-4 text-center">
                  iOS: 設定 &gt; Safari &gt; カメラ で許可<br />
                  Android: 設定 &gt; アプリ &gt; ブラウザ &gt; 権限 で許可
                </p>
              )}
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-white/20 text-white text-sm rounded-lg"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
                />
                {/* カウントダウン表示 */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">{countdown}</span>
                    </div>
                  </div>
                )}
                {/* タイマー選択（上部） */}
                <div className="absolute top-[env(safe-area-inset-top,12px)] pt-3 inset-x-0 flex items-center justify-center gap-2">
                  {[0, 3, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setTimerSeconds(sec)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur transition-colors ${
                        timerSeconds === sec
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {sec === 0 ? 'OFF' : `${sec}秒`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pb-[env(safe-area-inset-bottom,20px)] pt-4 pb-6 flex items-center justify-center gap-6 bg-black/80">
                <button
                  onClick={hideCamera}
                  className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-lg"
                >
                  ✕
                </button>
                <button
                  onClick={handleShutter}
                  disabled={countdown !== null}
                  className="w-16 h-16 bg-white rounded-full border-4 border-orange-400 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-60"
                >
                  <div className={`w-12 h-12 rounded-full ${timerSeconds > 0 ? 'bg-orange-500 flex items-center justify-center' : 'bg-orange-500'}`}>
                    {timerSeconds > 0 && countdown === null && (
                      <span className="text-white text-xs font-bold">{timerSeconds}s</span>
                    )}
                  </div>
                </button>
                <button
                  onClick={toggleCamera}
                  className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white text-lg"
                  title={facingMode === 'environment' ? 'インカメに切替' : '外カメに切替'}
                >
                  🔄
                </button>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : preview ? (
        <>
          <div className="relative mb-3">
            <img
              src={preview}
              alt="プレビュー"
              className="w-full rounded-xl object-cover max-h-48 cursor-pointer active:opacity-80 transition-opacity"
              onClick={() => setPreviewExpanded(true)}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
              タップで拡大
            </div>
            <button
              onClick={() => { setImageFile(null); setPreview(null); startCamera() }}
              className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
          {/* 拡大プレビュー */}
          {previewExpanded && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
              onClick={() => setPreviewExpanded(false)}
            >
              <img
                src={preview}
                alt="拡大プレビュー"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewExpanded(false)
                    setImageFile(null)
                    setPreview(null)
                    startCamera()
                  }}
                  className="px-6 py-3 bg-white/15 text-white text-sm font-medium rounded-full backdrop-blur active:scale-95 transition-transform"
                >
                  撮り直す
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewExpanded(false)
                  }}
                  className="px-6 py-3 bg-orange-500 text-white text-sm font-medium rounded-full active:scale-95 transition-transform"
                >
                  この写真を使う
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => startCamera()}
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

      {/* 締め切り超過の警告 */}
      {isPassedDeadline && (
        <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5">
          <p className="text-sm text-yellow-700 font-semibold">今日は締め切り（{checkinDeadline}）を過ぎてしまいましたね😢</p>
          <p className="text-xs text-yellow-600 mt-0.5">それでも投稿しようとしているのは偉いです！</p>
        </div>
      )}

      {/* 送信ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading || !imageFile}
        className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-all active:scale-[0.98]"
      >
        {loading ? '投稿中...' : isPassedDeadline ? '締切超過で記録を投稿する' : '記録を投稿する'}
      </button>
    </div>
  )
}
