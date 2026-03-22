import { getSessionUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import CheckinForm from '@/components/CheckinForm'
import CheckinShareCard from '@/components/CheckinShareCard'
import ReactionButton from '@/components/ReactionButton'
import ReportButton from '@/components/ReportButton'

type Props = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ from?: string }>
}

export default async function GroupTimelinePage({ params, searchParams }: Props) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const backHref = resolvedSearchParams?.from === 'checkin' ? '/checkin' : '/challenges'
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })

  // 全クエリを並列実行（1段階で全て取得）
  const [
    { data: group },
    { data: myMember },
    { data: todayCheckin },
    { data: checkins },
    { count: memberCount },
  ] = await Promise.all([
    supabase.from('groups').select('*, challenges(*)').eq('id', id).single(),
    supabase.from('group_members').select('id, joined_at').eq('group_id', id).eq('user_id', user.id).single(),
    supabase.from('checkins').select('id').eq('group_id', id).eq('user_id', user.id).gte('checked_in_at', `${today}T00:00:00`).lt('checked_in_at', `${today}T23:59:59`).maybeSingle(),
    supabase.from('checkins').select('*, profiles!checkins_user_id_profiles_fkey(nickname, avatar_url)').eq('group_id', id).order('checked_in_at', { ascending: false }).limit(20),
    supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', id),
  ])

  if (!group) notFound()
  const hasCheckedInToday = !!todayCheckin

  // リアクション・報告・チェックイン数を並列取得
  const checkinIds = checkins?.map(c => c.id) ?? []
  const [{ data: allReactions }, { data: myReports }, { count: myCheckinCount }] = await Promise.all([
    checkinIds.length > 0
      ? supabase.from('reactions').select('checkin_id, emoji, user_id').in('checkin_id', checkinIds)
      : Promise.resolve({ data: [] as { checkin_id: string; emoji: string; user_id: string }[] }),
    checkinIds.length > 0
      ? supabase.from('reports').select('checkin_id').in('checkin_id', checkinIds)
      : Promise.resolve({ data: [] as { checkin_id: string }[] }),
    myMember
      ? supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('member_id', myMember.id)
      : Promise.resolve({ count: 0 }),
  ])
  const reportedCheckinIds = new Set((myReports ?? []).map(r => r.checkin_id))

  // リアクションをcheckin_idでグループ化（O(n)で一括処理）
  const reactionsByCheckin = new Map<string, Map<string, { count: number; hasReacted: boolean }>>()
  for (const r of allReactions ?? []) {
    let emojiMap = reactionsByCheckin.get(r.checkin_id)
    if (!emojiMap) {
      emojiMap = new Map()
      reactionsByCheckin.set(r.checkin_id, emojiMap)
    }
    const existing = emojiMap.get(r.emoji) ?? { count: 0, hasReacted: false }
    existing.count++
    if (r.user_id === user!.id) existing.hasReacted = true
    emojiMap.set(r.emoji, existing)
  }
  const getReactionsForCheckin = (checkinId: string) => {
    const emojiMap = reactionsByCheckin.get(checkinId)
    if (!emojiMap) return []
    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }))
  }

  const durationDays = group.challenges?.duration_days ?? 1
  const isFlexible = group.challenges?.schedule_type === 'flexible'
  const myRate = Math.min(Math.round(((myCheckinCount ?? 0) / durationDays) * 100), 100)

  // リーチ判定
  const joinedAt = myMember?.joined_at ? new Date(myMember.joined_at) : new Date()
  const now = new Date()
  const elapsedDays = Math.max(1, Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const requiredDays = Math.ceil(durationDays * 0.85)
  const allowedMisses = durationDays - requiredDays
  const missedDays = elapsedDays - (myCheckinCount ?? 0)
  const remainingMisses = allowedMisses - missedDays
  const remainingDaysTillEnd = durationDays - elapsedDays
  const isOngoing = remainingDaysTillEnd >= 0
  const isExtension = isFlexible && !isOngoing // 延長戦（いつでも参加の期間超過）
  const extensionDays = elapsedDays - durationDays // 延長何日目か

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={backHref} className="text-gray-400 hover:text-gray-600 shrink-0">
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
              {isOngoing && myRate < 85 && (
                <p className="text-xs text-orange-500">あと{Math.max(requiredDays - (myCheckinCount ?? 0), 0)}日で返金ライン</p>
              )}
            </div>
            {isOngoing && remainingMisses <= 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-sm text-red-600 font-semibold">
                  {remainingMisses < 0
                    ? '⛔ 達成率85%を下回っています。今日から毎日記録しましょう！'
                    : '🚨 あと1日でもサボるとアウト！今日も必ず記録しよう！'}
                </p>
              </div>
            )}
            {isOngoing && remainingMisses === 1 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5">
                <p className="text-sm text-yellow-700 font-semibold">⚠️ あと1回だけサボれます。油断禁物！</p>
              </div>
            )}
            {/* 延長戦（いつでも参加で期間超過） */}
            {isExtension && (
              <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-3 py-2.5">
                <p className="text-sm text-indigo-700 font-semibold">
                  🔥 延長戦 {extensionDays}日目 — ここからは自分との戦い！
                </p>
                <p className="text-xs text-indigo-500 mt-1">
                  チャレンジ期間は終了しましたが、引き続き記録を続けられます。通算 {myCheckinCount ?? 0}日達成中！
                </p>
              </div>
            )}
          </div>
        )}

        {/* チェックイン状態 */}
        {!isOngoing && !isFlexible ? (
          /* 固定期間チャレンジの期間終了 */
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-center">
            <div className="text-4xl mb-2">🏁</div>
            <p className="text-gray-700 font-bold text-lg">チャレンジ期間が終了しました</p>
            <p className="text-gray-500 text-sm mt-1">お疲れさまでした！</p>
          </div>
        ) : hasCheckedInToday ? (
          <CheckinShareCard
            checkinCount={myCheckinCount ?? 0}
            durationDays={durationDays}
            challengeTitle={group.challenges?.title ?? 'チャレンジ'}
          />
        ) : (
          <CheckinForm groupId={id} memberId={myMember?.id ?? ''} challengeId={group.challenges?.id} durationDays={durationDays} checkinDeadline={isExtension ? null : group.challenges?.checkin_deadline} challengeTitle={group.challenges?.title ?? 'チャレンジ'} />
        )}

        {/* タイムライン */}
        <h3 className="font-semibold text-gray-900 mb-3">みんなの投稿</h3>
        {checkins && checkins.length > 0 ? (
          <div className="space-y-3">
            {checkins.map((checkin) => (
              <div key={checkin.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/user/${checkin.user_id}`} className="shrink-0">
                    {checkin.profiles?.avatar_url ? (
                      <Image src={checkin.profiles.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {(checkin.profiles?.nickname ?? '?')[0]}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/user/${checkin.user_id}`} className="font-medium text-gray-900 text-sm hover:underline">
                      {checkin.profiles?.nickname ?? '匿名'}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {checkin.user_id !== user.id && (
                    <ReportButton
                      checkinId={checkin.id}
                      alreadyReported={reportedCheckinIds.has(checkin.id)}
                    />
                  )}
                </div>
                {checkin.photo_url && (
                  <div className="relative w-full rounded-xl mb-2 overflow-hidden" style={{ maxHeight: '288px' }}>
                    <Image
                      src={checkin.photo_url}
                      alt="証拠写真"
                      width={500}
                      height={500}
                      className="w-full object-cover"
                      loading="lazy"
                      sizes="(max-width: 512px) 100vw, 512px"
                    />
                  </div>
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
            <p className="text-xs mt-1">最初の記録をしてみよう！</p>
          </div>
        )}
      </main>
    </div>
  )
}
