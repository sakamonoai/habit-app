'use client'

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // エラー情報をコンソールに出力（Vercelのファンクションログで確認可能）
  console.error('[HOME PAGE ERROR]', error.message, error.digest, error.stack)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">タイムラインの読み込みに失敗しました</h2>
        <p className="text-sm text-gray-500 mb-1">エラー: {error.message}</p>
        {error.digest && <p className="text-xs text-gray-400 mb-4">ID: {error.digest}</p>}
        <button
          onClick={reset}
          className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
        >
          再読み込み
        </button>
      </div>
    </div>
  )
}
