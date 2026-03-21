'use client'

import { useState } from 'react'

const STEPS = [
  {
    icon: '1️⃣',
    title: 'チャレンジを選ぶ',
    desc: 'やりたい習慣のチャレンジを探して、詳細ページを確認しましょう。期間・ルール・OK例/NG例をよく読んでから参加を決めてください。',
  },
  {
    icon: '2️⃣',
    title: 'デポジットを預けて参加',
    desc: '自分に合った金額のデポジットを選んで参加します。このお金は達成すれば全額返ってきます。無理のない金額を選びましょう。',
  },
  {
    icon: '3️⃣',
    title: '毎日チェックイン',
    desc: '毎日、証拠写真を撮影して投稿するだけ。下のナビバーの「認証」ボタンからカメラを起動して写真を撮り、チャレンジを選んで投稿します。',
  },
  {
    icon: '4️⃣',
    title: '仲間と励まし合う',
    desc: 'タイムラインで同じチャレンジの仲間の投稿が見れます。リアクションを送って励まし合いましょう。一人じゃないから続けられる！',
  },
  {
    icon: '5️⃣',
    title: '達成率をチェック',
    desc: 'マイページから自分の達成率を確認できます。達成率 = チェックインした日数 ÷ チャレンジ期間の日数。85%以上を目指しましょう。',
  },
]

const RESULTS = [
  {
    icon: '🎉',
    title: '85%以上達成',
    desc: 'デポジット全額返金！しっかり習慣化できた証拠です。',
    color: 'bg-green-50 border-green-200',
  },
  {
    icon: '🏆',
    title: '100%達成',
    desc: 'デポジット返金に加えて、スポンサーから特典がもらえることがあります（スポンサー募集中）',
    color: 'bg-yellow-50 border-yellow-200',
  },
  {
    icon: '😢',
    title: '85%未満',
    desc: '残念ながらデポジットは返金されません。次回こそ頑張りましょう！',
    color: 'bg-red-50 border-red-200',
  },
]

const FAQ = [
  {
    q: 'チェックインは1日何回できますか？',
    a: '1つのチャレンジにつき1日1回です。日付が変わればまた投稿できます。',
  },
  {
    q: '写真は何でもいいですか？',
    a: 'いいえ。チャレンジ詳細にあるOK例・NG例を必ず確認してください。関係のない写真や使い回しは不正とみなされる場合があります。',
  },
  {
    q: '途中でやめることはできますか？',
    a: 'できません。一度参加したチャレンジは期間終了まで続きます。参加前によく検討してください。',
  },
  {
    q: 'デポジットはいつ返金されますか？',
    a: 'チャレンジ期間終了後、達成率の集計が完了次第、自動で返金処理が行われます。',
  },
  {
    q: '不正な投稿を見つけたら？',
    a: 'タイムラインの投稿にある報告ボタンから、運営に通報できます。',
  },
]

export default function HowToUseGuide() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">🎯</div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">チャレンジの使い方</p>
            <p className="text-xs text-gray-400">チャレンジって何？どうやるの？</p>
          </div>
        </div>
        <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg font-medium">見る</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* ヘッダー */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                ← 戻る
              </button>
              <h1 className="font-semibold text-gray-900">使い方ガイド</h1>
            </div>
          </header>

          <main className="max-w-lg mx-auto px-4 py-6">
            {/* イントロ */}
            <div className="text-center mb-8">
              <p className="text-4xl mb-3">💪</p>
              <h2 className="text-xl font-bold text-gray-900 mb-2">チャレンジの進め方</h2>
              <p className="text-sm text-gray-500">
                デポジットを預けて、毎日チェックインするだけ。<br />
                達成すればお金が戻ってくる、シンプルな仕組みです。
              </p>
            </div>

            {/* ステップ */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4">参加の流れ</h3>
              <div className="space-y-4">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-2xl shrink-0">{step.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 結果 */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4">チャレンジ終了後</h3>
              <div className="space-y-3">
                {RESULTS.map((r, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${r.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{r.icon}</span>
                      <span className="font-semibold text-gray-900 text-sm">{r.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 達成率の計算 */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4">達成率の計算方法</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-center mb-3">
                  <p className="text-sm text-gray-500">達成率の計算式</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    チェックインした日数 ÷ チャレンジ期間 × 100
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">例: 21日間チャレンジの場合</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">21日中 18日チェックイン</span>
                      <span className="font-semibold text-green-500">→ 86% (返金)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">21日中 21日チェックイン</span>
                      <span className="font-semibold text-yellow-500">→ 100% (返金+特典の可能性)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">21日中 14日チェックイン</span>
                      <span className="font-semibold text-red-500">→ 67% (没収)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4">よくある質問</h3>
              <div className="space-y-3">
                {FAQ.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-900 text-sm mb-1">Q. {item.q}</p>
                    <p className="text-sm text-gray-600">A. {item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* フッター */}
            <div className="text-center pb-8">
              <button
                onClick={() => setOpen(false)}
                className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  )
}
