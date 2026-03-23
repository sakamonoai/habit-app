'use client'

import { useEffect } from 'react'

const BUILD_ID = '20260323-v5'

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[HOME PAGE ERROR]', error.message, error.digest, error.stack)

  // エラー発生時にSWキャッシュを強制クリア
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs =>
        regs.forEach(r => r.unregister())
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">タイムラインの読み込みに失敗しました</h2>
        <p className="text-sm text-gray-500 mb-1">エラー: {error.message}</p>
        {error.digest && <p className="text-xs text-gray-400 mb-4">ID: {error.digest}</p>}
        <p className="text-xs text-gray-300 mb-2">build: {BUILD_ID} | {error.digest ? 'server' : 'client'}</p>
        <details className="text-left mb-4">
          <summary className="text-xs text-gray-400 cursor-pointer">スタックトレース</summary>
          <pre className="text-[10px] text-gray-400 mt-2 whitespace-pre-wrap break-all max-h-40 overflow-auto bg-gray-50 p-2 rounded">
            {error.stack || 'N/A'}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
        >
          再読み込み（キャッシュクリア済み）
        </button>
      </div>
    </div>
  )
}
