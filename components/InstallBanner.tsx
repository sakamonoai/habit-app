'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // 既にPWAとして起動している場合は表示しない
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // 既に閉じたことがある場合は表示しない
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (dismissed) return

    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/.test(ua))
    setShowBanner(true)
  }, [])

  const dismiss = () => {
    setShowBanner(false)
    localStorage.setItem('install-banner-dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-16 left-4 right-4 max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-30">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📲</div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">ホーム画面に追加</p>
          <p className="text-xs text-gray-500 mt-1">
            {isIOS
              ? '下の共有ボタン → 「ホーム画面に追加」をタップ'
              : 'メニュー → 「ホーム画面に追加」をタップ'}
          </p>
        </div>
        <button onClick={dismiss} className="text-gray-400 text-sm">✕</button>
      </div>
    </div>
  )
}
