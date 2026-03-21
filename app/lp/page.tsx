import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ハビチャレ | 三日坊主を卒業する習慣化アプリ',
  description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金、サボったら没収。だから今度こそ続く。',
  openGraph: {
    title: 'ハビチャレ | 三日坊主を卒業する習慣化アプリ',
    description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金、サボったら没収。',
    images: [{ url: '/ogp.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ハビチャレ | 三日坊主を卒業する習慣化アプリ',
    description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金。',
    images: ['/ogp.jpg'],
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヒーロー */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black" />
        <div className="relative max-w-lg mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white/70 mb-6">
            三日坊主を卒業する習慣化アプリ
          </div>
          <h1 className="text-4xl font-black leading-tight mb-4">
            一人じゃ続かない。<br />
            <span className="text-orange-400">仲間となら</span>変われる。
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            「また続かなかった…」を終わりにしよう。<br />
            お金を預けて、仲間と一緒にチャレンジ。<br />
            達成すれば全額返金。サボったら没収。<br />
            だから、今度こそ続く。
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/signup"
              className="block w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-colors shadow-lg"
            >
              無料で始める
            </Link>
            <Link
              href="/login"
              className="block w-full py-3 text-white/50 font-medium text-sm hover:text-white transition-colors"
            >
              すでにアカウントをお持ちの方
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[2rem]" />
      </section>

      {/* こんな人にオススメ */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-8">こんな経験、ありませんか？</h2>

        <div className="space-y-3">
          {[
            '何をやっても三日坊主で終わってしまう',
            '一人だとモチベーションが続かない',
            '早起き・運動・勉強…始めるけど毎回挫折',
            '「明日からやろう」が口癖になっている',
            '誰かと一緒なら頑張れる気がする',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
              <span className="text-orange-400">✓</span>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          一つでも当てはまるなら、<span className="font-bold text-orange-500">ハビチャレ</span>がぴったりです。
        </p>
      </section>

      {/* 3つの特徴 */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">なぜ続くのか？</h2>
        <p className="text-center text-sm text-gray-400 mb-10">ハビチャレが習慣化を実現する3つの仕組み</p>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="shrink-0 w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">デポジット制</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                参加時にデポジットを預ける。85%以上達成で全額返金。サボったら没収。「損したくない」という気持ちが最強のモチベーション。
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
              📸
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">証拠写真で記録</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                毎日の習慣を写真で記録。「やったフリ」はできない。写真を撮る行為自体が習慣のスイッチになる。
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">仲間の力</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                同じチャレンジに取り組む仲間のタイムラインが見える。「みんな頑張ってる」から自分もやろうと思える。
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="max-w-lg mx-auto px-6 py-12">
          <h2 className="text-center text-2xl font-black text-gray-900 mb-2">使い方はシンプル</h2>
          <p className="text-center text-sm text-gray-400 mb-10">たった3ステップ</p>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">チャレンジを選んで参加</h3>
                <p className="text-sm text-gray-500">
                  運動、早起き、読書…やりたいチャレンジを選んで参加。デポジットは自分で金額を決められるものと、固定のものがあります。自分の許容範囲内の金額で始められます。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">毎日写真を撮ってチェックイン</h3>
                <p className="text-sm text-gray-500">
                  習慣を実行したら証拠写真を撮って投稿。仲間の投稿にリアクションも。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">85%以上達成でデポジット返金！</h3>
                <p className="text-sm text-gray-500">
                  チャレンジ期間終了後、達成率85%以上ならデポジットは引き落とされません。100%達成で特典も！
                </p>
              </div>
            </div>
          </div>
      </section>

      {/* デポジットの仕組み */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">安心のデポジット設計</h2>
        <p className="text-center text-sm text-gray-400 mb-8">シンプルで透明な料金体系</p>

        <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-lg mt-0.5">✅</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">85%以上達成 → 全額返金</p>
              <p className="text-xs text-gray-500">デポジットは引き落とされません</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-lg mt-0.5">🏆</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">100%達成 → 特典GET</p>
              <p className="text-xs text-gray-500">スポンサーからのご褒美がもらえることも</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">85%未満 → デポジット没収</p>
              <p className="text-xs text-gray-500">だからこそ「サボれない」仕組み</p>
            </div>
          </div>

          <div className="border-t border-orange-200 pt-4 mt-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              ※ チャレンジ参加時にシステム利用料（10%）がかかります。<br />
              ※ 決済はStripeを利用。カード情報はサービス側で保持しません。
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* チャレンジ例 */}
      <section className="max-w-lg mx-auto px-6 py-12">
          <h2 className="text-center text-2xl font-black text-gray-900 mb-2">こんなチャレンジがあります</h2>
          <p className="text-center text-sm text-gray-400 mb-8">自分に合ったチャレンジを見つけよう</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '🏃', title: '毎日30分ランニング', days: '14日間', color: 'from-orange-400 to-rose-400' },
              { emoji: '☀️', title: '朝6時起きチャレンジ', days: '7日間', color: 'from-yellow-400 to-orange-400' },
              { emoji: '📚', title: '毎日読書30分', days: '21日間', color: 'from-blue-400 to-indigo-400' },
              { emoji: '💪', title: '筋トレ習慣化', days: '14日間', color: 'from-green-400 to-teal-400' },
            ].map((item) => (
              <div key={item.title} className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 text-white aspect-square flex flex-col justify-between`}>
                <span className="text-4xl">{item.emoji}</span>
                <div>
                  <p className="font-bold text-sm leading-tight">{item.title}</p>
                  <p className="text-white/70 text-xs mt-1">{item.days}</p>
                </div>
              </div>
            ))}
          </div>
      </section>

      {/* Q&A */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-8">よくある質問</h2>

        <div className="space-y-4">
          {[
            {
              q: 'デポジットはいくらですか？',
              a: 'チャレンジによって異なります。自分で金額を選べるものと、固定のものがあります。',
            },
            {
              q: 'アプリのダウンロードは必要ですか？',
              a: 'いいえ。ブラウザからそのまま使えるWebアプリ（PWA）です。ホーム画面に追加すればアプリのように使えます。',
            },
            {
              q: '途中でやめることはできますか？',
              a: 'チャレンジ開始後の途中退出はできません。最後まで挑戦しましょう！',
            },
            {
              q: '本当にお金は返ってきますか？',
              a: '85%以上達成すれば、デポジットの引き落としは行われません（オーソリ方式）。Stripeによる安全な決済です。',
            },
            {
              q: '自分でチャレンジを作れますか？',
              a: 'はい。オリジナルのチャレンジを作成して、仲間を集めることができます。',
            },
          ].map((item) => (
            <div key={item.q} className="border border-gray-100 rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Q. {item.q}</h3>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-lg mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-black mb-3">さあ、始めよう</h2>
          <p className="text-white/60 text-sm mb-8">
            一人じゃ続かなかったことも、<br />
            仲間とデポジットがあれば変われる。
          </p>
          <Link
            href="/signup"
            className="inline-block w-full max-w-xs py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-colors shadow-lg"
          >
            無料でアカウント作成
          </Link>
          <p className="text-white/40 text-xs mt-4">
            ※ アカウント作成は無料です。デポジットはチャレンジ参加時のみ発生します。
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-lg mx-auto px-6 text-center space-y-3">
          <p className="text-white font-bold text-lg">ハビチャレ</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
            <Link href="/tokushoho" className="hover:text-white transition-colors">特商法表記</Link>
          </div>
          <p className="text-xs text-gray-500">© 2026 株式会社buzzlife</p>
        </div>
      </footer>
    </div>
  )
}
