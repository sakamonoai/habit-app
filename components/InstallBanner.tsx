'use client'

import { useState, useEffect } from 'react'

type Platform = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android-other' | 'desktop-chrome' | 'desktop-other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)

  if (isIOS && isSafari) return 'ios-safari'
  if (isIOS && isChrome) return 'ios-chrome'
  if (isAndroid && isChrome) return 'android-chrome'
  if (isAndroid) return 'android-other'
  if (isChrome) return 'desktop-chrome'
  return 'desktop-other'
}

const INSTALL_STEPS: Record<Platform, { title: string; steps: string[] }> = {
  'ios-safari': {
    title: 'iPhone (Safari)',
    steps: [
      '画面下の共有ボタン（□↑）をタップ',
      '「ホーム画面に追加」をタップ',
      '右上の「追加」をタップ',
    ],
  },
  'ios-chrome': {
    title: 'iPhone (Chrome)',
    steps: [
      '右下の「…」メニューをタップ',
      '「ホーム画面に追加」をタップ',
      'Safariで開き直してからホーム画面に追加する必要がある場合があります',
    ],
  },
  'android-chrome': {
    title: 'Android (Chrome)',
    steps: [
      '右上の「⋮」メニューをタップ',
      '「ホーム画面に追加」または「アプリをインストール」をタップ',
      '「インストール」をタップ',
    ],
  },
  'android-other': {
    title: 'Android',
    steps: [
      'ブラウザのメニューを開く',
      '「ホーム画面に追加」をタップ',
      'Chrome推奨：より良い体験ができます',
    ],
  },
  'desktop-chrome': {
    title: 'PC (Chrome)',
    steps: [
      'アドレスバー右のインストールアイコン（⊕）をクリック',
      '「インストール」をクリック',
    ],
  },
  'desktop-other': {
    title: 'PC',
    steps: [
      'Chrome推奨：アドレスバーのインストールボタンからインストール',
      '他のブラウザではブックマークをご利用ください',
    ],
  },
}

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [platform, setPlatform] = useState<Platform>('ios-safari')

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (dismissed) return

    setPlatform(detectPlatform())
    setShowBanner(true)
  }, [])

  const dismiss = () => {
    setShowBanner(false)
    localStorage.setItem('install-banner-dismissed', 'true')
  }

  if (!showBanner) return null

  const info = INSTALL_STEPS[platform]

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📲</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">アプリとして使う</p>
            <p className="text-xs text-gray-500 mt-1">ホーム画面に追加すると、アプリのように使えます</p>
            <button
              onClick={() => setShowDetail(true)}
              className="mt-2 text-xs text-orange-500 font-medium"
            >
              追加方法を見る →
            </button>
          </div>
          <button onClick={dismiss} className="text-gray-400 text-sm">✕</button>
        </div>
      </div>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <span className="text-4xl">📲</span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">ホーム画面に追加</h3>
              <p className="text-xs text-gray-400 mt-1">{info.title}</p>
            </div>

            <div className="space-y-3 mb-5">
              {info.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDetail(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl text-sm"
              >
                閉じる
              </button>
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 bg-orange-500 text-white font-medium rounded-xl text-sm"
              >
                わかった
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
