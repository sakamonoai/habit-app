import { getSessionUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import JoinButton from '@/components/JoinButton'
import ReviewForm from '@/components/ReviewForm'
import TimelinePreview from '@/components/TimelinePreview'
import ChallengeReportButton from '@/components/ChallengeReportButton'

const HowToUseGuide = dynamic(() => import('@/components/HowToUseGuide'))

type Props = {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  // チャレンジとグループを並列取得
  const [{ data: challenge }, { data: group }] = await Promise.all([
    supabase.from('challenges').select('*').eq('id', id).neq('status', 'suspended').single(),
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

  // タイムラインプレビュー用のチェックインを取得（最新5件）
  const { data: previewCheckins } = group
    ? await supabase
        .from('checkins')
        .select('id, photo_url, comment, checked_in_at, profiles!checkins_user_id_profiles_fkey(nickname)')
        .eq('group_id', group.id)
        .order('checked_in_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const isJoined = !!myMembership
  const hasReviewed = !!myReview
  const isFull = (memberCount ?? 0) >= challenge.max_group_size

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

      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* サムネイル */}
        {challenge.thumbnail_url && (
          <div className="mb-4 -mx-4 -mt-6">
            <Image src={challenge.thumbnail_url} alt={challenge.title} width={800} height={400} className="w-full aspect-[2/1] object-cover" priority sizes="(max-width: 512px) 100vw, 512px" />
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
              <p className="text-xs text-gray-500 mb-1">デポジット</p>
              <p className="text-lg font-bold text-orange-500">
                {challenge.deposit_type === 'fixed'
                  ? `¥${(challenge.deposit_amount ?? 1000).toLocaleString()}`
                  : '¥500〜'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {challenge.deposit_type === 'fixed' ? '金額固定' : '自分で選べる'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">期間</p>
              <p className="text-lg font-bold text-blue-500">{durationLabel(challenge.duration_days)}</p>
              {challenge.schedule_type === 'fixed' && challenge.start_date && challenge.end_date && (
                <p className="text-xs text-blue-400 mt-0.5">
                  {new Date(challenge.start_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  〜{new Date(challenge.end_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">参加者</p>
              <p className="text-lg font-bold text-green-500">{memberCount ?? 0} / {challenge.max_group_size}人</p>
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

        {/* 通報ボタン（作成者以外に表示） */}
        {challenge.created_by !== user.id && (
          <div className="text-right mb-4">
            <ChallengeReportButton challengeId={id} />
          </div>
        )}

        {/* 使い方ガイド */}
        <HowToUseGuide />

        {/* OK例・NG例 */}
        {(challenge.ok_photo_url || challenge.ng_photo_url) && (() => {
          const okPhotos: { url: string; desc: string }[] = challenge.ok_photo_url ? JSON.parse(challenge.ok_photo_url) : []
          const ngPhotos: { url: string; desc: string }[] = challenge.ng_photo_url ? JSON.parse(challenge.ng_photo_url) : []
          const hasPhotos = okPhotos.length > 0 || ngPhotos.length > 0
          if (!hasPhotos) return null
          return (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">こうやって認証してください</h3>

              {/* OK例 */}
              {okPhotos.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {okPhotos.map((photo, i) => (
                      <div key={i} className="shrink-0 w-44">
                        <div className="relative rounded-xl overflow-hidden">
                          <Image src={photo.url} alt={`OK例${i + 1}`} width={176} height={224} className="w-44 h-56 object-cover" loading="lazy" />
                          <div className="absolute bottom-0 inset-x-0 bg-green-500 py-1.5 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">○</span>
                          </div>
                        </div>
                        {photo.desc && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{photo.desc}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NG例 */}
              {ngPhotos.length > 0 && (
                <div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {ngPhotos.map((photo, i) => (
                      <div key={i} className="shrink-0 w-44">
                        <div className="relative rounded-xl overflow-hidden">
                          <Image src={photo.url} alt={`NG例${i + 1}`} width={176} height={224} className="w-44 h-56 object-cover" loading="lazy" />
                          <div className="absolute bottom-0 inset-x-0 bg-red-500 py-1.5 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">✕</span>
                          </div>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">失敗処理</span>
                        </div>
                        {photo.desc && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{photo.desc}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* タイムラインプレビュー */}
        {!isJoined && (previewCheckins ?? []).length > 0 && (
          <TimelinePreview checkins={previewCheckins ?? []} />
        )}

        {/* 参加者レビュー */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">参加者のレビュー</h3>
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
              depositType={challenge.deposit_type ?? 'choosable'}
              fixedDepositAmount={challenge.deposit_amount ?? 1000}
            />
          )}
        </div>
      </main>
    </div>
  )
}
