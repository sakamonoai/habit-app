'use client'

import { useRouter } from 'next/navigation'

export default function TermsPage() {
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
          <h1 className="text-lg font-semibold text-gray-900">利用規約</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-400 mb-6">最終更新日: 2026年3月21日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第1条 総則</h2>
            <p>
              本利用規約（以下「本規約」）は、ハビチャレ（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは、本規約に同意の上、本サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第2条 定義</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>「ユーザー」とは、本サービスに登録し利用する個人をいいます。</li>
              <li>「チャレンジ」とは、本サービス上で提供される習慣化プログラムをいいます。</li>
              <li>「デポジット」とは、チャレンジ参加時にユーザーが預け入れる金銭をいいます。</li>
              <li>「スポンサー」とは、チャレンジに対して景品・特典を提供する企業・団体をいいます。</li>
              <li>「チェックイン」とは、ユーザーが習慣の実施を証拠写真とともに記録する行為をいいます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第3条 サービスの内容</h2>
            <p className="mb-2">
              本サービスは、ユーザーが少人数グループでチャレンジに参加し、
              毎日の習慣を証拠写真の投稿により記録・共有することで習慣化を支援するサービスです。
            </p>
            <p>
              本サービスは PWA（Progressive Web App）として提供され、
              対応するWebブラウザからご利用いただけます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第4条 デポジットと返金</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3">
              <p className="font-medium text-orange-800 mb-2">重要事項</p>
              <ul className="space-y-2 text-orange-700">
                <li>
                  チャレンジ参加時に、参加費（デポジット）とシステム利用料をお支払いいただきます。
                </li>
                <li>
                  達成率85%以上の場合、デポジットの引き落としは行われません（オーソリゼーションがリリースされます）。
                </li>
                <li>
                  達成率85%未満の場合、デポジット全額が引き落とされます。
                </li>
                <li className="font-semibold">
                  未達成者のデポジットが達成者に分配されることはありません。
                </li>
              </ul>
            </div>
            <p>
              達成率は「投稿した日数 / チャレンジ期間の日数 x 100」で計算されます。
              システム利用料は達成・未達成に関わらず返金されません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第5条 禁止事項</h2>
            <p className="mb-2">ユーザーは以下の行為を行ってはなりません。</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>虚偽のチェックイン（過去の写真の使い回し、他人の写真の流用等）</li>
              <li>他のユーザーへの嫌がらせ、誹謗中傷</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正な手段によるデポジットの返金請求</li>
              <li>本サービスを利用した営業活動、宗教活動、政治活動</li>
              <li>その他、運営が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第6条 免責事項</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                本サービスは現状有姿で提供され、特定目的への適合性、
                完全性、正確性について保証するものではありません。
              </li>
              <li>
                通信環境やサーバー障害等によりサービスが一時的に利用できない場合がありますが、
                これによるデポジットの特別な取り扱いは行いません。
                ただし、運営の判断によりチャレンジ期間の延長等の措置を講じる場合があります。
              </li>
              <li>
                ユーザー間のトラブルについて、運営は一切の責任を負いません。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第7条 プライバシー</h2>
            <p>
              ユーザーの個人情報の取り扱いについては、別途定める
              <button
                onClick={() => router.push('/privacy')}
                className="text-orange-500 hover:underline"
              >
                プライバシーポリシー
              </button>
              に従います。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第8条 規約の変更</h2>
            <p>
              運営は、必要に応じて本規約を変更することがあります。
              変更後の規約は本サービス上に掲示した時点で効力を生じるものとします。
              重要な変更の場合は、事前にユーザーに通知いたします。
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
