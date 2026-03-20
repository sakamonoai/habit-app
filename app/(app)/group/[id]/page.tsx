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

  // グループ情報取得
  const { data: group } = await supabase
    .from('groups')
    .select('*, challenges(*)')
    .eq('id', id)
    .single()

  if (!group) notFound()

  // 自分のメンバーIDを取得
  const { data: myMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  // 今日既にチェックインしたか確認
  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckin } = await supabase
    .from('checkins')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .gte('checked_in_at', `${today}T00:00:00`)
    .lt('checked_in_at', `${today}T23:59:59`)
    .maybeSingle()

  const hasCheckedInToday = !!todayCheckin

  // タイムライン取得（直近20件）
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, profiles!checkins_user_id_profiles_fkey(nickname)')
    .eq('group_id', id)
    .order('checked_in_at', { ascending: false })
    .limit(20)

  // 各チェックインのリアクションを取得
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

  // 達成率計算
  const durationDays = group.challenges?.duration_days ?? 1
  const { count: myCheckinCount } = myMember
    ? await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', myMember.id)
    : { count: 0 }
  const myRate = Math.min(Math.round(((myCheckinCount ?? 0) / durationDays) * 100), 100)

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {group.challenges?.title ?? 'グループ'}
            </h1>
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
                className={`h-3 rounded-full transition-all ${myRate >= 85 ? 'bg-green-500' : myRate >= 50 ? 'bg-orange-500' : 'bg-red-400'}`}
                style={{ width: `${myRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{myCheckinCount ?? 0} / {durationDays}日</p>
          </div>
        )}

        {/* チェックイン状態 */}
        {hasCheckedInToday ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-green-700 font-semibold">今日のチェックイン完了！</p>
            <p className="text-green-600 text-sm">明日もがんばろう</p>
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">
                    🔥
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
                    className="w-full rounded-xl mb-2 object-cover max-h-64"
                  />
                )}
                {checkin.comment && (
                  <p className="text-sm text-gray-600">{checkin.comment}</p>
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
            <p className="text-sm">まだ投稿がありません。最初の投稿をしよう！</p>
          </div>
        )}
      </main>
    </div>
  )
}
