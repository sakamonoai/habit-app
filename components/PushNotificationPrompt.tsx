'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const DISMISS_KEY = 'push_prompt_dismissed_at'
const DISMISS_DAYS = 3

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    // Already granted or denied
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return

    // Check dismiss timestamp
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = new Date(dismissed)
      const now = new Date()
      const diffDays = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < DISMISS_DAYS) return
    }

    setVisible(true)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setVisible(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as BufferSource,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      setVisible(false)
    } catch {
      // User cancelled or error
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-30">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🔔</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">通知を受け取りますか？</p>
            <p className="text-xs text-gray-500 mt-0.5">
              チェックインのリマインドやチャレンジ結果をお知らせします
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {loading ? '設定中...' : '通知を受け取る'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-400 py-2 px-3 hover:text-gray-600 transition-colors"
              >
                後で
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
