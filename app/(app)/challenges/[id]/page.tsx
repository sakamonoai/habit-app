import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import JoinButton from '@/components/JoinButton'
import ReviewForm from '@/components/ReviewForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // チャレンジとグループを並列取得
  const [{ data: challenge }, { data: group }] = await Promise.all([
    supabase.from('challenges').select('*').eq('id', id).single(),
    supabase.from('groups').select('id').eq('challenge_id', id).maybeSingle(),
  ])

  if (!challenge) notFound()

  // メンバー数・参加チェック・レビュー・自分のレビュー・累積参加者を並列取得
  const [
    { count: memberCount },
    { data: myMembership },
    { data: reviews },
    { data: myReview },
    { count: totalParticipants },
  ] = await Promise.all([
    group
      ? supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id)
      : Promise.resolve({ count: 0 }),
    group
      ? supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_profiles_fkey(nickname)')
      .eq('challenge_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reviews')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', id),
  ])

  const isJoined = !!myMembership
  const hasReviewed = !!myReview
  const isFull = (memberCount ?? 0) >= challenge.max_members

  // レビュー平均計算
  const reviewList = reviews ?? []
  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1)
    : null

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
        {/* サムネイル */}
        {challenge.thumbnail_url && (
          <div className="mb-4 -mx-4 -mt-6">
            <img src={challenge.thumbnail_url} alt={challenge.title} className="w-full aspect-[2/1] object-cover" />
          </div>
        )}

        {/* チャレンジ情報カード */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{challenge.title}</h2>
          {avgRating && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="font-bold text-gray-900">{avgRating}</span>
              <span className="text-gray-400 text-sm">({reviewList.length}件)</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-sm">累計{totalParticipants ?? 0}人参加</span>
            </div>
          )}
          {challenge.description && (
            <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">デポジット目安</p>
              <p className="text-lg font-bold text-orange-500">¥500〜</p>
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

        {/* 報告例の画像 */}
        {challenge.example_photo_url && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">報告例</h3>
            <p className="text-xs text-gray-400 mb-3">このような写真を毎日投稿してください</p>
            <img
              src={challenge.example_photo_url}
              alt="報告例"
              className="w-full rounded-xl object-cover max-h-64"
            />
          </div>
        )}

        {/* 参加者レビュー */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">参加者の後記</h3>
            {avgRating && (
              <span className="text-sm text-gray-400">累計{totalParticipants ?? 0}人参加</span>
            )}
          </div>

          {avgRating ? (
            <>
              {/* 平均評価 */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={`text-sm ${n <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{reviewList.length}件</p>
                </div>
              </div>

              {/* レビュー一覧 */}
              <div className="space-y-4">
                {reviewList.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`text-xs ${n <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mb-1">{review.comment}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{review.profiles?.nickname ?? '匿名'}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">まだレビューはありません</p>
            </div>
          )}
        </div>

        {/* レビュー投稿（参加者のみ・未レビューのみ） */}
        {isJoined && !hasReviewed && (
          <div className="mb-4">
            <ReviewForm challengeId={id} />
          </div>
        )}

        {/* 参加ボタン */}
        <div className="sticky bottom-4">
          {isJoined && group ? (
            <Link
              href={`/group/${group.id}`}
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
