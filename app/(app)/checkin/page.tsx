import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CheckinPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // メンバーシップ（チャレンジ情報join）を1クエリで取得
  const { data: memberships } = await supabase
    .from('group_members')
    .select('id, group_id, challenge_id, joined_at, challenges(title, duration_days)')
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
      .gte('checked_in_at', `${today}T00:00:00`)
      .lt('checked_in_at', `${today}T23:59:59`),
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
    const challenge = m.challenges as unknown as { title: string; duration_days: number } | null
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
    }
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">認証</h1>
          <p className="text-sm text-gray-400 mt-0.5">今日のチェックインを記録しよう</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-28">
        <div className="space-y-3">
          {groups.map((g) => (
            <Link
              key={g.groupId}
              href={`/group/${g.groupId}`}
              className="block bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
            >
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
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
