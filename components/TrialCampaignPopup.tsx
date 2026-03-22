'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TrialCampaignPopup() {
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 今日既に表示済みならスキップ
    const lastShown = localStorage.getItem('trial_campaign_last_shown')
    const today = new Date().toISOString().split('T')[0]
    if (lastShown === today) return

    // 少し遅延して表示（ログイン直後のUX向上）
    const timer = setTimeout(() => setShow(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('trial_campaign_last_shown', today)
    setShow(false)
  }

  const handleDismiss = () => dismiss()

  const handleGoToChallenges = () => {
    dismiss()
    router.push('/challenges')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden animate-slide-up">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 pt-6 pb-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-tr-full" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold">お試しキャンペーン中！</h2>
            <p className="text-white/90 text-sm mt-1">期間限定で全チャレンジ無料</p>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-green-600 font-bold text-sm">0</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">デポジット無料</p>
                <p className="text-xs text-gray-500">お金をかけずにチャレンジを体験</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg">💳</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">カード登録不要</p>
                <p className="text-xs text-gray-500">ワンタップですぐ参加できます</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg">🔥</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">すべての機能が使える</p>
                <p className="text-xs text-gray-500">写真投稿・タイムライン・実績シェア</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoToChallenges}
            className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] mb-2"
          >
            チャレンジを見てみる
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            あとで
          </button>
        </div>
      </div>
    </div>
  )
}
