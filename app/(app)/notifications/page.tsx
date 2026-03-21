'use client'

import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mr-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">お知らせ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ハビチャレ、サービス開始しました！</p>
                <p className="text-xs text-gray-500 mt-1">
                  仲間と一緒にチャレンジして、習慣を身につけよう。達成したらデポジットが戻ってきます。まずはチャレンジを探してみてください！
                </p>
                <p className="text-xs text-gray-300 mt-2">2026年3月21日</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
