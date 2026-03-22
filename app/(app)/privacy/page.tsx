'use client'

import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
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
          <h1 className="text-lg font-semibold text-gray-900">プライバシーポリシー</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-400 mb-6">最終更新日: 2026年3月21日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. 収集する情報</h2>
            <p className="mb-2">本サービスでは、以下の情報を収集します。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>メールアドレス（アカウント登録・ログインのため）</li>
              <li>ニックネーム（サービス内での表示のため）</li>
              <li>プロフィール画像（任意、サービス内での表示のため）</li>
              <li>チェックイン写真（習慣の達成記録のため）</li>
              <li>決済情報（Stripe経由で処理、当社サーバーには保存しません）</li>
              <li>利用端末・ブラウザ情報（サービス改善のため）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. 利用目的</h2>
            <p className="mb-2">収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>本サービスの提供・運営</li>
              <li>ユーザー認証・アカウント管理</li>
              <li>チャレンジの達成率計算・デポジットの返金処理</li>
              <li>グループ内でのチェックイン共有（参加メンバー間のみ）</li>
              <li>プッシュ通知の送信（チェックインリマインダー等）</li>
              <li>サービスの改善・新機能の開発</li>
              <li>利用規約違反の調査・対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. 第三者提供</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
              <p className="font-medium text-blue-800 mb-2">写真データの取り扱いについて</p>
              <p className="text-blue-700">
                ユーザーが投稿したチェックイン写真を、ユーザーの明示的な同意なく
                スポンサー企業その他の第三者に提供することはありません。
              </p>
            </div>
            <p className="mb-2">以下の場合を除き、個人情報を第三者に提供しません。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命・身体・財産の保護のために必要な場合</li>
              <li>サービス提供に必要な業務委託先（Supabase、Stripe、Vercel等）への提供</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. データの保管</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>ユーザーデータは Supabase（クラウドデータベース）に保管されます。</li>
              <li>チェックイン写真は Supabase Storage に保管されます。</li>
              <li>決済情報は Stripe のサーバーで安全に管理され、当社のサーバーには保存されません。</li>
              <li>通信はすべて SSL/TLS で暗号化されています。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. データの削除</h2>
            <p className="mb-2">
              ユーザーはいつでもアカウントの削除を請求できます。
              アカウント削除時には、以下のデータが削除されます。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>プロフィール情報（ニックネーム、プロフィール画像）</li>
              <li>チェックイン写真</li>
              <li>チャレンジ参加履歴</li>
            </ul>
            <p className="mt-2">
              ただし、法令上保存が義務付けられている情報（決済記録等）については、
              所定の期間保管した後に削除します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. お問い合わせ</h2>
            <p>
              個人情報の取り扱いに関するお問い合わせは、
              以下のお問い合わせページよりお願いいたします。
            </p>
            <p className="mt-2">
              <a
                href="https://habit-app-sand.vercel.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
              >
                https://habit-app-sand.vercel.app/privacy
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pb-8 text-center text-xs text-gray-400">
          ハビチャレ運営事務局
        </div>
      </main>
    </div>
  )
}
