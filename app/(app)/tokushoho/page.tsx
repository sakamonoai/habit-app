'use client'

import { useRouter } from 'next/navigation'

export default function TokushohoPage() {
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
          <h1 className="text-lg font-semibold text-gray-900">特定商取引法に基づく表記</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-0 text-sm">
          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">販売事業者名</dt>
            <dd className="text-gray-900">[運営者名] ※準備中</dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">所在地</dt>
            <dd className="text-gray-900">[住所] ※準備中</dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">連絡先</dt>
            <dd className="text-gray-900">[メールアドレス] ※準備中</dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">販売価格</dt>
            <dd className="text-gray-900">
              チャレンジごとに異なります。各チャレンジ詳細ページに表示される
              「システム利用料」および「デポジット（参加費）」の合計金額となります。
            </dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">支払方法</dt>
            <dd className="text-gray-900">クレジットカード（Stripe経由）</dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">支払時期</dt>
            <dd className="text-gray-900">
              チャレンジ参加申込時にオーソリゼーション（与信枠確保）を行います。
              チャレンジ終了後、達成率に基づいて引き落としまたはリリースが行われます。
            </dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">返金ポリシー</dt>
            <dd className="text-gray-900">
              <ul className="space-y-1 mt-1">
                <li>達成率85%以上: デポジットの引き落としは行われません（オーソリゼーションリリース）</li>
                <li>達成率85%未満: デポジット全額が引き落とされます</li>
                <li>システム利用料: 達成・未達成に関わらず返金されません</li>
              </ul>
            </dd>
          </div>

          <div className="border-b border-gray-100 py-4">
            <dt className="font-medium text-gray-500 mb-1">サービス提供時期</dt>
            <dd className="text-gray-900">
              参加申込・決済完了後、チャレンジ開始日からサービスを提供します。
            </dd>
          </div>

          <div className="py-4">
            <dt className="font-medium text-gray-500 mb-1">動作環境</dt>
            <dd className="text-gray-900">
              最新版のGoogle Chrome、Safari、Microsoft Edge等のWebブラウザ。
              PWA（Progressive Web App）として動作します。
            </dd>
          </div>
        </div>

        <div className="mt-10 pb-8 text-center text-xs text-gray-400">
          ハビチャレ運営事務局
        </div>
      </main>
    </div>
  )
}
