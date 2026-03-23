'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">😵</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">ページの読み込みに失敗しました</h2>
        <p className="text-sm text-gray-500 mb-6">
          一時的なエラーが発生しました。もう一度お試しください。
        </p>
        <button
          onClick={reset}
          className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
        >
          もう一度試す
        </button>
      </div>
    </div>
  )
}
