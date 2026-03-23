import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTodayBoundsUTC } from '@/lib/timezone'

export default async function CheckinPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('timezone').eq('id', user.id).single()
  const userTz = myProfile?.timezone || 'Asia/Tokyo'
  const { today, todayStartUTC, todayEndUTC } = getTodayBoundsUTC(userTz)

  // メンバーシップ（チャレンジ情報join）を1クエリで取得
  const { data: memberships } = await supabase
    .from('group_members')
    .select('id, group_id, challenge_id, joined_at, challenges(title, duration_days, status, schedule_type, start_date)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold text-gray-900">記録</h1>
            <p className="text-sm text-gray-400 mt-0.5">今日の記録を残そう</p>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-sm">参加中のチャレンジがありません</p>
          <Link href="/challenges" className="text-orange-500 text-sm mt-2 inline-block font-medium">チャレンジを探す →</Link>
        </main>
      </div>
    )
  }

  const memberIds = memberships.map(m => m.id)

  // 今日のチェックインとチェックイン数を並列取得
  const [{ data: todayCheckins }, { data: allCheckinCounts }] = await Promise.all([
    supabase
      .from('checkins')
      .select('member_id')
      .in('member_id', memberIds)
      .gte('checked_in_at', todayStartUTC)
      .lt('checked_in_at', todayEndUTC),
    (async () => {
      const res = await supabase.rpc('get_checkin_counts', { member_ids: memberIds })
      if (res.data) return { data: res.data as { member_id: string; count: number }[] }
      // RPCフォールバック
      const counts = await Promise.all(memberIds.map(async mid => {
        const { count } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('member_id', mid)
        return { member_id: mid, count: count ?? 0 }
      }))
      return { data: counts }
    })(),
  ])

  const todaySet = new Set((todayCheckins ?? []).map(c => c.member_id))
  const countMap: Record<string, number> = {}
  if (Array.isArray(allCheckinCounts)) {
    for (const row of allCheckinCounts as { member_id: string; count: number }[]) {
      countMap[row.member_id] = row.count
    }
  }

  const now = new Date()
  const groups = memberships.map(m => {
    const challenge = m.challenges as unknown as { title: string; duration_days: number; status: string | null; schedule_type: string | null; start_date: string | null } | null
    const durationDays = challenge?.duration_days ?? 1
    const checkinCount = countMap[m.id] ?? 0
    const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)

    const joinedAt = m.joined_at ? new Date(m.joined_at) : now
    const elapsedDays = Math.max(1, Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const requiredDays = Math.ceil(durationDays * 0.85)
    const allowedMisses = durationDays - requiredDays
    const missedDays = elapsedDays - checkinCount
    const remainingMisses = allowedMisses - missedDays
    const isOngoing = durationDays - elapsedDays >= 0

    // チャレンジが削除/停止、またはfixedで期間終了ならアーカイブ
    const isDeleted = !challenge || challenge.status === 'deleted' || challenge.status === 'suspended'
    const isFixedEnded = challenge?.schedule_type === 'fixed' && !isOngoing
    const isArchived = isDeleted || isFixedEnded

    // まだ開始していないか判定（fixed: start_date未到来, flexible: joined_atが未来）
    const notStartedYet = challenge?.schedule_type === 'fixed' && challenge.start_date
      ? challenge.start_date > today
      : joinedAt > now
    const startDateLabel = challenge?.schedule_type === 'fixed' && challenge.start_date
      ? challenge.start_date
      : m.joined_at ? m.joined_at.split('T')[0] : null

    return {
      groupId: m.group_id,
      memberId: m.id,
      title: challenge?.title ?? '不明',
      checkedInToday: todaySet.has(m.id),
      rate,
      checkinCount,
      durationDays,
      remainingMisses,
      isOngoing,
      isArchived,
      isDeleted,
      notStartedYet,
      startDateLabel,
    }
  })

  const activeGroups = groups.filter(g => !g.isArchived)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">記録</h1>
          <p className="text-sm text-gray-400 mt-0.5">今日の達成記録を残そう</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-28">
        {/* アクティブなチャレンジ */}
        {activeGroups.length > 0 && (
          <div className="space-y-3 mb-6">
            {activeGroups.map((g) => (
              <Link
                key={g.groupId}
                href={`/group/${g.groupId}?from=checkin`}
                className="block bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
              >
                {g.notStartedYet ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{g.title}</h3>
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <span className="text-xl">⏳</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-600 font-semibold">
                        📅 {g.startDateLabel ? `${new Date(g.startDateLabel).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}から開始` : 'まもなく開始'}
                      </p>
                    </div>
                  </>
                ) : (
                <>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{g.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${g.rate >= 85 ? 'bg-green-500' : g.rate >= 50 ? 'bg-orange-400' : 'bg-gray-400'}`}
                          style={{ width: `${Math.max(g.rate, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{g.checkinCount}/{g.durationDays}日</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {g.checkedInToday ? (
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">✅</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📸</span>
                      </div>
                    )}
                  </div>
                </div>
                {g.isOngoing && g.remainingMisses <= 0 && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-600 font-semibold">
                      {g.remainingMisses < 0
                        ? '⛔ 達成率85%を下回っています…'
                        : '🚨 あと1日でもサボるとアウトです！'}
                    </p>
                  </div>
                )}
                {g.isOngoing && g.remainingMisses === 1 && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-yellow-700 font-semibold">⚠️ あと1回だけサボれます。油断禁物！</p>
                  </div>
                )}
                </>
                )}
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
