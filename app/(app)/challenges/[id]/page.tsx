import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import JoinButton from '@/components/JoinButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

  // 参加メンバー数を取得
  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', id)

  // 自分が参加済みか確認
  const { data: myMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  const isJoined = !!myMembership
  const isFull = (memberCount ?? 0) >= challenge.max_members

  const durationLabel = (days: number) => {
    if (days <= 7) return `${days}日間`
    if (days <= 31) return `${Math.round(days / 7)}週間`
    return `${Math.round(days / 30)}ヶ月`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <h1 className="font-semibold text-gray-900 truncate">{challenge.title}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* チャレンジ情報カード */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h2>
          {challenge.description && (
            <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">デポジット</p>
              <p className="text-lg font-bold text-orange-500">¥{challenge.deposit_amount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">期間</p>
              <p className="text-lg font-bold text-blue-500">{durationLabel(challenge.duration_days)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">参加者</p>
              <p className="text-lg font-bold text-green-500">{memberCount ?? 0} / {challenge.max_members}人</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">達成条件</p>
              <p className="text-lg font-bold text-purple-500">85%以上</p>
            </div>
          </div>
        </div>

        {/* ルール説明 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">ルール</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span>📸</span>
              <span>毎日、証拠写真を投稿してチェックイン</span>
            </li>
            <li className="flex gap-2">
              <span>🎯</span>
              <span>85%以上達成でデポジット全額返金</span>
            </li>
            <li className="flex gap-2">
              <span>🏆</span>
              <span>100%達成でスポンサー特典GET</span>
            </li>
            <li className="flex gap-2">
              <span>⚠️</span>
              <span>85%未満の場合、デポジットは返金されません</span>
            </li>
          </ul>
        </div>

        {/* 参加ボタン */}
        <div className="sticky bottom-4">
          {isJoined ? (
            <Link
              href={`/group/${id}`}
              className="block w-full py-4 bg-green-500 text-white font-semibold rounded-2xl text-center hover:bg-green-600 transition-colors"
            >
              タイムラインを見る
            </Link>
          ) : (
            <JoinButton
              challengeId={id}
              isFull={isFull}
            />
          )}
        </div>
      </main>
    </div>
  )
}
