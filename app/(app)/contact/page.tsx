'use client'

import { useRouter } from 'next/navigation'

export default function ContactPage() {
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
          <h1 className="text-lg font-semibold text-gray-900">お問い合わせ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-6">
          <p className="text-sm text-gray-700">
            サービスに関するご質問・ご要望・不具合のご報告は、以下よりお気軽にご連絡ください。
          </p>

          <div className="space-y-4">
            <a
              href="https://x.com/AImaru_company"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-lg">
                X
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">X (Twitter) で連絡</p>
                <p className="text-xs text-gray-400">@AImaru_company</p>
              </div>
              <span className="ml-auto text-gray-300">→</span>
            </a>

            <a
              href="mailto:info@buzzlife.net"
              className="flex items-center gap-3 bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
                ✉
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">メールで連絡</p>
                <p className="text-xs text-gray-400">info@buzzlife.net</p>
              </div>
              <span className="ml-auto text-gray-300">→</span>
            </a>
          </div>

          <p className="text-xs text-gray-400">
            通常、2営業日以内にご返信いたします。
          </p>
        </div>
      </main>
    </div>
  )
}
