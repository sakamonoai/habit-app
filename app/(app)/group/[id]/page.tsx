import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CheckinForm from '@/components/CheckinForm'
import ReactionButton from '@/components/ReactionButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GroupTimelinePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // 全クエリを並列実行
  const [
    { data: group },
    { data: myMember },
    { data: todayCheckin },
    { data: checkins },
  ] = await Promise.all([
    supabase.from('groups').select('*, challenges(*)').eq('id', id).single(),
    supabase.from('group_members').select('id').eq('group_id', id).eq('user_id', user.id).single(),
    supabase.from('checkins').select('id').eq('group_id', id).eq('user_id', user.id).gte('checked_in_at', `${today}T00:00:00`).lt('checked_in_at', `${today}T23:59:59`).maybeSingle(),
    supabase.from('checkins').select('*, profiles!checkins_user_id_profiles_fkey(nickname)').eq('group_id', id).order('checked_in_at', { ascending: false }).limit(20),
  ])

  if (!group) notFound()
  const hasCheckedInToday = !!todayCheckin

  // リアクション取得（チェックイン結果に依存）
  const checkinIds = checkins?.map(c => c.id) ?? []
  const { data: allReactions } = checkinIds.length > 0
    ? await supabase
        .from('reactions')
        .select('checkin_id, emoji, user_id')
        .in('checkin_id', checkinIds)
    : { data: [] }

  // リアクションを集計
  const getReactionsForCheckin = (checkinId: string) => {
    const checkinReactions = (allReactions ?? []).filter(r => r.checkin_id === checkinId)
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>()
    for (const r of checkinReactions) {
      const existing = emojiMap.get(r.emoji) ?? { count: 0, hasReacted: false }
      existing.count++
      if (r.user_id === user!.id) existing.hasReacted = true
      emojiMap.set(r.emoji, existing)
    }
    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }))
  }

  // 達成率とメンバー数を並列取得
  const durationDays = group.challenges?.duration_days ?? 1
  const [{ count: myCheckinCount }, { count: memberCount }] = await Promise.all([
    myMember
      ? supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('member_id', myMember.id)
      : Promise.resolve({ count: 0 }),
    supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', id),
  ])
  const myRate = Math.min(Math.round(((myCheckinCount ?? 0) / durationDays) * 100), 100)

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600 shrink-0">
            ← 戻る
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {group.challenges?.title ?? 'グループ'}
            </h1>
            <p className="text-xs text-gray-400">{memberCount ?? 0}人参加中</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 自分の達成率 */}
        {myMember && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">あなたの達成率</span>
              <span className={`text-lg font-bold ${myRate >= 85 ? 'text-green-500' : myRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {myRate}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${myRate >= 85 ? 'bg-green-500' : myRate >= 50 ? 'bg-orange-500' : 'bg-red-400'}`}
                style={{ width: `${Math.max(myRate, 2)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400">{myCheckinCount ?? 0} / {durationDays}日</p>
              {myRate < 85 && (
                <p className="text-xs text-orange-500">あと{Math.max(Math.ceil(durationDays * 0.85) - (myCheckinCount ?? 0), 0)}日で返金ライン</p>
              )}
            </div>
          </div>
        )}

        {/* チェックイン状態 */}
        {hasCheckedInToday ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-green-800 font-bold text-lg">今日もやりきった！</p>
            <p className="text-green-600 text-sm mt-1">連続記録を伸ばしていこう</p>
          </div>
        ) : (
          <CheckinForm groupId={id} memberId={myMember?.id ?? ''} />
        )}

        {/* タイムライン */}
        <h3 className="font-semibold text-gray-900 mb-3">みんなの投稿</h3>
        {checkins && checkins.length > 0 ? (
          <div className="space-y-3">
            {checkins.map((checkin) => (
              <div key={checkin.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {(checkin.profiles?.nickname ?? '?')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {checkin.profiles?.nickname ?? '匿名'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {checkin.photo_url && (
                  <img
                    src={checkin.photo_url}
                    alt="証拠写真"
                    className="w-full rounded-xl mb-2 object-cover max-h-72"
                  />
                )}
                {checkin.comment && (
                  <p className="text-sm text-gray-600 mb-1">{checkin.comment}</p>
                )}
                <ReactionButton
                  checkinId={checkin.id}
                  initialReactions={getReactionsForCheckin(checkin.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm">まだ投稿がありません</p>
            <p className="text-xs mt-1">最初のチェックインをしてみよう！</p>
          </div>
        )}
      </main>
    </div>
  )
}
