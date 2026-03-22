import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ハビチャレ｜サボるとお金を没収されるアプリ',
  description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金、サボったら没収。だから今度こそ続く。',
  openGraph: {
    title: 'ハビチャレ｜サボるとお金を没収されるアプリ',
    description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金、サボったら没収。',
    images: [{ url: '/ogp.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ハビチャレ｜サボるとお金を没収されるアプリ',
    description: '一人じゃ続かない。仲間となら変われる。デポジットを預けて仲間とチャレンジ。達成すれば全額返金。',
    images: ['/ogp.png'],
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヒーロー — 恐怖訴求 → Dream Outcome */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black" />
        <div className="relative max-w-lg mx-auto px-6 pt-8 pb-24 text-center">
          <p className="text-orange-400 font-black text-lg tracking-wide mb-4">サボるとお金を没収されるアプリ</p>
          <Image src="/logo.png" alt="ハビチャレ" width={64} height={64} className="mx-auto mb-5" />
          <div className="inline-block border border-red-400/40 bg-red-500/10 rounded-full px-4 py-1.5 text-sm font-bold text-red-400 mb-6 animate-pulse">
            サボったら、お金没収。
          </div>
          <h1 className="text-4xl font-black leading-tight mb-5">
            <span className="text-red-400">「また明日から」</span><br />
            その言い訳に、<br />
            <span className="text-orange-400">いくら払った？</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-2">
            ジム会費、参考書、ダイエット食品、英会話教材——<br />
            <span className="text-white font-bold">使わなかったものに払ったお金</span>、<br />
            もう思い出したくないですよね。
          </p>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            ハビチャレは逆の発想。<br />
            先にお金を預けて、<span className="text-green-400 font-bold">やり切れば全額戻る</span>。<br />
            サボったら<span className="text-red-400 font-bold">没収</span>。シンプルだから続く。
          </p>

          {/* 数字で証明 — Perceived Likelihood */}
          <div className="flex justify-center gap-6 mb-10">
            <div>
              <p className="text-3xl font-black text-orange-400">7日</p>
              <p className="text-xs text-white/40">最短チャレンジ</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-3xl font-black text-green-400">85%</p>
              <p className="text-xs text-white/40">達成で全額返金</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-3xl font-black text-white">0円</p>
              <p className="text-xs text-white/40">アプリ利用料</p>
            </div>
          </div>

          {/* キャンペーンバナー */}
          <div className="max-w-xs mx-auto mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-2xl px-5 py-4">
            <p className="text-amber-400 font-black text-sm mb-1">🎉 期間限定キャンペーン中！</p>
            <p className="text-white text-sm font-bold">クレカ登録なし・デポジット無料で<br />今すぐお試しできます</p>
            <p className="text-white/50 text-xs mt-2">※ キャンペーン終了後は通常のデポジット制になります</p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/signup"
              className="block w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
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

      {/* 問題提起 — Pain を深掘り */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">正直に答えてください。</h2>
        <p className="text-center text-sm text-gray-400 mb-8">こんな経験、何回繰り返しましたか？</p>

        <div className="space-y-3">
          {[
            { text: '「今度こそ続ける」→ 3日で挫折', sub: '意志の力だけでは無理だった' },
            { text: 'ジム会費だけ毎月引き落とされてる', sub: '行かないのに月8,000円…' },
            { text: '早起きアプリを5個入れて、全部消した', sub: 'アプリだけじゃ起きれない' },
            { text: '「明日からやろう」が365日続いてる', sub: 'その明日は永遠に来ない' },
          ].map((item) => (
            <div key={item.text} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-lg">×</span>
                <p className="text-sm font-semibold text-gray-800">{item.text}</p>
              </div>
              <p className="text-xs text-gray-400 ml-8 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            続かないのは、あなたの意志が弱いからじゃない。<br />
            <span className="font-black text-orange-600 text-base">「サボっても何も失わない環境」</span><br />
            にいるからです。
          </p>
        </div>
      </section>

      {/* 解決策 — なぜ続くのか（Value Equation） */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">ハビチャレが<span className="text-orange-500">続く</span>理由</h2>
        <p className="text-center text-sm text-gray-400 mb-10">意志力に頼らない、3つの「仕組み」</p>

        <div className="space-y-6">
          {/* Effort & Sacrifice を最小化 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="shrink-0 w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">
                💸
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">お金がかかっている緊張感</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  参加時にデポジットを預ける。達成すれば全額返金、サボったら没収。<span className="font-semibold text-gray-700">「損したくない」は意志力の10倍強い。</span>
                </p>
              </div>
            </div>
          </div>

          {/* Perceived Likelihood を最大化 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="shrink-0 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
                👀
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">仲間と切磋琢磨しながら、自然とサボれなくなる</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  同じチャレンジに取り組む仲間の継続記録がタイムラインで見える。励まし合う仲間であると同時に、<span className="font-semibold text-gray-700">お互いの継続を自然に監視し合う関係</span>でもあるから、
                  「自分だけサボるわけにいかない」という健全な緊張感が続きます。
                </p>
              </div>
            </div>
            <div className="mt-4 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">📋 グループタイムライン</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-200 rounded-full" />
                  <p className="text-xs text-gray-600"><span className="font-semibold">Aさん</span>が朝ランの写真を投稿 — <span className="text-blue-600">連続12日目</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-200 rounded-full" />
                  <p className="text-xs text-gray-600"><span className="font-semibold">Bさん</span>が読書記録を投稿 — <span className="text-blue-600">連続8日目</span></p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">仲間の継続記録が見えるから、切磋琢磨できる。しかもお互いの進捗が可視化されるので、自然と「見られている」「自分もやらなきゃ」が生まれる。</p>
            </div>
          </div>

          {/* Time Delay を最小化 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="shrink-0 w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">
                📸
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">やることは「写真を撮る」だけ</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  習慣を実行したら証拠写真を撮って投稿。複雑な操作ゼロ。<span className="font-semibold text-gray-700">アプリのダウンロードすら不要。</span>ブラウザだけで完結。
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ビフォー・アフター — Dream Outcome の可視化 */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-8">
          <span className="text-gray-300">Before</span> → <span className="text-orange-500">After</span>
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Before</p>
              <p className="text-sm text-gray-500">「明日からやろう」</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Before</p>
              <p className="text-sm text-gray-500">3日目でアラーム消す</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Before</p>
              <p className="text-sm text-gray-500">自分に自信がない</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <p className="text-xs text-orange-400 mb-1">After</p>
              <p className="text-sm font-semibold text-orange-600">「今日もやった」が積み重なる</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <p className="text-xs text-orange-400 mb-1">After</p>
              <p className="text-sm font-semibold text-orange-600">21日間、休まず達成</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <p className="text-xs text-orange-400 mb-1">After</p>
              <p className="text-sm font-semibold text-orange-600">「続けられる自分」に変わる</p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方 — Time Delay を最小化 */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-center text-2xl font-black text-gray-900 mb-2">始め方は、たった3ステップ</h2>
          <p className="text-center text-sm text-gray-400 mb-10">登録から参加まで2分で完了</p>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">チャレンジを選ぶ。自分で作ることもできる</h3>
                <p className="text-sm text-gray-500 mb-4">
                  運動、早起き、読書…参加したいチャレンジを選ぶだけでなく、自分でオリジナルのチャレンジを作成して仲間を集めることもできます。金額は自分で決められるものと固定のものがあります。
                </p>
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                  <Image
                    src="/lp/challenge-page-preview.svg"
                    alt="チャレンジ一覧ページのイメージ。既存のチャレンジに参加したり、自分でチャレンジを作って仲間を集めたりできる画面"
                    width={1200}
                    height={900}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">毎日、写真を1枚撮るだけ</h3>
                <p className="text-sm text-gray-500">
                  習慣を実行したら証拠写真をパシャリ。仲間の投稿も見える。「みんなやってる」から自分もやる。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">やり切れば、お金は全額戻ってくる</h3>
                <p className="text-sm text-gray-500">
                  85%以上達成でデポジット全額返金。100%達成でスポンサーから特典がもらえることも。失うのはサボった人だけ。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* デポジットの仕組み — Guarantee（保証） */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">あなたが失うのは<span className="text-red-500">「サボった時」</span>だけ</h2>
        <p className="text-center text-sm text-gray-400 mb-8">やり切る人は1円も損しない設計</p>

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
              <p className="font-semibold text-gray-900 text-sm">100%達成 → 特典がもらえる可能性も</p>
              <p className="text-xs text-gray-500">スポンサー企業から特典が届くことがあります（スポンサー募集中！）</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg mt-0.5">💸</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">85%未満 → デポジット没収</p>
              <p className="text-xs text-gray-500">だからこそ本気になれる</p>
            </div>
          </div>

          <div className="border-t border-orange-200 pt-4 mt-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              ※ 参加時の追加手数料はかかりません。<br />
              ※ 決済はStripeを利用。カード情報はサービス側で保持しません。
            </p>
          </div>
        </div>
      </section>

      {/* 料金体系 — わかりやすく */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-center text-2xl font-black text-gray-900 mb-2">料金体系</h2>
          <p className="text-center text-sm text-gray-400 mb-8">アプリ利用は無料。実際に費用が発生するのは継続できなかった時だけです</p>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
            <p className="text-sm font-bold text-orange-700 text-center leading-relaxed">
              アプリ利用は無料。<br />
              追加のシステム手数料はありません。<br />
              継続できなかった時だけ、デポジットが没収されます。
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">✅</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">アプリ利用料は無料</h3>
                <p className="text-xs text-gray-500 mt-1">アカウント作成・チャレンジ閲覧・タイムライン利用はすべて0円。参加しただけでは費用は発生しません。</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg">🔧</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">参加しただけでは費用はかからない</h3>
                <p className="text-xs text-gray-500 mt-1">アカウント作成からチャレンジ参加まで、追加のシステム手数料はかかりません。実際に費用が発生するのは、継続できなかった場合だけです。</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-lg">🔒</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">デポジット没収は継続できなかった時だけ</h3>
                <p className="text-xs text-gray-500 mt-1">85%以上達成すればデポジットは全額返金。継続できず、達成率が85%未満だった場合だけ没収されます。</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-orange-600">つまり：</span>参加しただけでは費用は0円。<br />
              継続できなかった時だけ費用が発生する設計です。
            </p>
          </div>
        </div>
      </section>

      {/* チャレンジ例 — Effort を下げる（具体的で手軽に見せる） */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-6">
          <h2 className="text-center text-2xl font-black text-gray-900 mb-2">まずは7日間から始められる</h2>
          <p className="text-center text-sm text-gray-400 mb-6">ハードルの低いチャレンジも多数</p>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-6">
            <p className="text-sm font-bold text-gray-900 mb-1">自分でチャレンジを作って、仲間を集めることも可能</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              既存のチャレンジに参加するだけでなく、あなた自身がテーマや期間を決めてチャレンジを作成できます。友達や同じ目標を持つ仲間を集めて、一緒に継続する場をつくれます。
            </p>
          </div>

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
        </div>
      </section>

      {/* Q&A — 残りの不安を潰す */}
      <section className="max-w-lg mx-auto px-6 py-12">
        <h2 className="text-center text-2xl font-black text-gray-900 mb-8">よくある質問</h2>

        <div className="space-y-4">
          {[
            {
              q: 'デポジットはいくらですか？',
              a: 'チャレンジによって異なります。自分で金額を選べるものと、固定のものがあります。無理のない金額から始められます。',
            },
            {
              q: 'アプリのダウンロードは必要ですか？',
              a: 'いいえ。ブラウザからそのまま使えるWebアプリ（PWA）です。ホーム画面に追加すればアプリのように使えます。',
            },
            {
              q: '途中でやめることはできますか？',
              a: 'チャレンジ開始後の途中退出はできません。だからこそ、覚悟を持って始めた人だけが集まります。',
            },
            {
              q: '本当にお金は返ってきますか？',
              a: '85%以上達成すれば、デポジットの引き落としは行われません（オーソリ方式）。Stripeによる安全な決済で、やり切った人が損することはありません。',
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
      </section>

      {/* 最終CTA — Urgency + Dream Outcome */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-lg mx-auto px-6 text-center text-white">
          <p className="text-red-400 text-sm font-bold mb-4">
            「また明日から」を何回繰り返しますか？
          </p>
          <h2 className="text-3xl font-black mb-3">
            今度こそ、<span className="text-orange-400">本気</span>で変わる。
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            お金を預ける覚悟がある人だけが集まる場所。<br />
            だから、ここでは「続けられる自分」に出会える。
          </p>
          <Link
            href="/signup"
            className="inline-block w-full max-w-xs py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
          >
            無料でアカウント作成
          </Link>
          <p className="text-white/30 text-xs mt-4">
            ※ アカウント作成は無料。費用が発生するのは継続できなかった場合のみ。
          </p>
        </div>
      </section>

      {/* スポンサー募集 */}
      <section className="bg-white py-16">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-sm font-bold text-orange-500 mb-2">FOR BUSINESS</p>
            <h2 className="text-2xl font-black text-gray-900 mb-2">スポンサー企業を募集しています</h2>
            <p className="text-sm text-gray-500">御社の商品・サービスを「実際に使い続ける」ユーザーと繋がりませんか？</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">商品を「毎日使う」体験を提供</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    御社の商品を使うチャレンジを作成可能。ユーザーはデポジットを預けて本気で取り組むため、<span className="font-semibold text-gray-700">確実に商品を継続利用</span>してもらえます。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  📸
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">リアルなUGC・口コミが自然に集まる</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    ユーザーは毎日の記録として商品の使用写真を投稿。<span className="font-semibold text-gray-700">作られたレビューではない、生の声と実体験</span>がチャレンジを通じて蓄積されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">達成者への特典でブランド好感度UP</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    100%達成した本気のユーザーに御社の特典を届けられます。<span className="font-semibold text-gray-700">努力の末に得た報酬は、通常の広告より圧倒的に好印象</span>に残ります。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              スポンサー提携にご興味のある企業様は<br />お気軽にお問い合わせください。
            </p>
            <Link
              href="/contact"
              className="inline-block w-full max-w-xs py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
            >
              お問い合わせはこちら
            </Link>
            <p className="text-xs text-gray-400 mt-3">
              ※ 個人・法人を問わずお気軽にご相談ください
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-lg mx-auto px-6 text-center space-y-3">
          <Image src="/logo.png" alt="ハビチャレ" width={40} height={40} className="mx-auto mb-1" />
          <p className="text-white font-bold text-lg">ハビチャレ</p>
          <div className="flex justify-center gap-4 text-xs flex-wrap">
            <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
            <Link href="/tokushoho" className="hover:text-white transition-colors">特商法表記</Link>
            <Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link>
          </div>
          <p className="text-xs text-gray-500">© 2026 株式会社buzzlife</p>
        </div>
      </footer>
    </div>
  )
}
