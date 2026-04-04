import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDepositTier } from '@/lib/deposit-tier'
import { getTodayBoundsUTC } from '@/lib/timezone'

const QUOTES = [
  '預けた金額の分だけ、強くなれる。',
  '累計デポジット額＝あなたがこれまで積み上げてきたものの価値だ。',
  'お金を預ける覚悟が、習慣を本物にする。',
  '「やります」は無料。デポジットは本気の証。',
  'リスクを取った回数だけ、自分を信じられるようになる。',
  '自分に賭けた金額が、そのまま自分への信頼になる。',
  '安全圏にいたままでは、何も変わらない。',
  '覚悟の重さは、デポジットの重さで測れる。',
  '今日の一歩が、明日のデポジットを守る。',
  'お金を預けた瞬間、言い訳はできなくなる。',
  '未来の自分に投資しろ。リターンは習慣だ。',
  '逃げ道を断った人間だけが、本当に前に進める。',
  'チャレンジ参加の数だけ強くなれるよ。',
]

export default async function HistoryPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  // 全履歴・バッジ・作成チャレンジを並列取得
  const [{ data: memberships }, { data: badges }, { data: createdChallenges }, { data: profile }] = await Promise.all([
    supabase
      .from('group_members')
      .select('*, challenges(title, duration_days, schedule_type, start_date)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false }),
    supabase
      .from('badges')
      .select('*, challenges(title, thumbnail_url, category)')
      .eq('user_id', user.id)
      .eq('badge_type', 'perfect'),
    supabase
      .from('challenges')
      .select('id, title, category, status, schedule_type, duration_days, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single(),
  ])

  const allMemberships = memberships ?? []

  // チェックイン数を一括取得
  const memberIds = allMemberships.map(m => m.id)
  let checkinCounts: Record<string, number> = {}
  if (memberIds.length > 0) {
    const { data: counts } = await supabase.rpc('get_checkin_counts', { member_ids: memberIds })
    if (counts) {
      for (const row of counts as { member_id: string; count: number }[]) {
        checkinCounts[row.member_id] = row.count
      }
    }
    // RPCフォールバック
    if (Object.keys(checkinCounts).length === 0) {
      const results = await Promise.all(
        memberIds.map(async (mid) => {
          const { count } = await supabase
            .from('checkins')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', mid)
          return { member_id: mid, count: count ?? 0 }
        })
      )
      for (const r of results) {
        checkinCounts[r.member_id] = r.count
      }
    }
  }

  const userTz = profile?.timezone || 'Asia/Tokyo'
  const { today, todayStartUTC, todayEndUTC } = getTodayBoundsUTC(userTz)

  // 今日チェックイン済みかを member_id ごとに取得
  const todayCheckinSet = new Set<string>()
  if (memberIds.length > 0) {
    const { data: todayCheckins } = await supabase
      .from('checkins')
      .select('member_id')
      .in('member_id', memberIds)
      .gte('checked_in_at', todayStartUTC)
      .lt('checked_in_at', todayEndUTC)
    todayCheckins?.forEach(c => todayCheckinSet.add(c.member_id))
  }

  // チャレンジ統計を計算
  const challengeStats = allMemberships.map((m) => {
    const challenge = m.challenges as { title: string; duration_days: number; schedule_type: string | null; start_date: string | null } | null
    const durationDays = challenge?.duration_days ?? 1
    const checkinCount = checkinCounts[m.id] ?? 0
    const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)
    const depositAmount = m.deposit_amount ?? 0

    const startDate = challenge?.schedule_type === 'fixed' && challenge.start_date
      ? challenge.start_date
      : (m.joined_at ? m.joined_at.split('T')[0] : today)
    const elapsedDays = Math.max(1, Math.floor((new Date(today + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const requiredDays = Math.ceil(durationDays * 0.85)
    const allowedMisses = durationDays - requiredDays
    const missedDays = elapsedDays - checkinCount
    const remainingMisses = allowedMisses - missedDays
    const checkedInToday = todayCheckinSet.has(m.id)
    const remainingMissesIfCheckinToday = checkedInToday ? remainingMisses : remainingMisses + 1
    const remainingDays = durationDays - elapsedDays
    const isOngoing = remainingDays >= 0

    const notStartedYet = challenge?.schedule_type === 'fixed' && challenge.start_date
      ? challenge.start_date > today
      : (m.joined_at ? new Date(m.joined_at) > new Date() : false)
    const startDateLabel = challenge?.schedule_type === 'fixed' && challenge.start_date
      ? challenge.start_date
      : m.joined_at ? m.joined_at.split('T')[0] : null

    return {
      membershipId: m.id,
      groupId: m.group_id,
      title: challenge?.title ?? '不明',
      durationDays,
      checkinCount,
      rate,
      depositAmount,
      status: m.status as string,
      remainingMisses,
      remainingMissesIfCheckinToday,
      checkedInToday,
      isOngoing,
      notStartedYet,
      startDateLabel,
      joinedAt: m.joined_at,
    }
  })

  // 期間終了したチャレンジはstatusがactiveでも「過去」として扱う
  const activeChallenges = challengeStats.filter(s => s.status === 'active' && s.isOngoing)
  const pastChallenges = challengeStats.filter(s => s.status !== 'active' || !s.isOngoing)

  const totalDeposit = allMemberships.reduce((sum, m) => sum + (m.deposit_amount ?? 0), 0)
  const completedCount = allMemberships.filter(m => m.status === 'completed').length
  const totalCheckins = challengeStats.reduce((sum, s) => sum + s.checkinCount, 0)
  const tier = getDepositTier(totalDeposit)

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

  const statusConfig = {
    completed: { label: '✅ 返金済み', bg: 'bg-green-100', text: 'text-green-700' },
    forfeited: { label: '❌ 没収', bg: 'bg-red-100', text: 'text-red-700' },
    active: { label: '⏳ 集計中', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  } as const

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ヒーローセクション */}
      <div className={`bg-gradient-to-br ${tier.gradient} px-4 pt-8 pb-6`}>
        <div className="max-w-lg mx-auto text-center">
          <p className="text-white/80 text-sm font-medium mb-1">累計デポジット</p>
          <p className="text-4xl font-extrabold text-white tracking-tight">
            ¥{totalDeposit.toLocaleString()}
          </p>
          {tier.name && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
              <span className="text-lg">{tier.icon}</span>
              <span className="text-white font-bold text-sm">{tier.name}</span>
            </div>
          )}
          {!tier.name && (
            <p className="text-white/60 text-xs mt-2">チャレンジに参加してデポジットを預けよう</p>
          )}
          <div className="mt-5 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4">
            <p className="text-white text-sm font-medium italic leading-relaxed">「{quote}」</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* サマリー統計 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 -mt-4 mb-6">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            <div className="text-center px-1">
              <p className="text-lg font-bold text-gray-900">¥{totalDeposit.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">累計額</p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-bold text-gray-900">{allMemberships.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">参加回数</p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-bold text-gray-900">{totalCheckins}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">総記録数</p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-bold text-green-500">{completedCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">返金成功</p>
            </div>
          </div>
        </div>

        {/* 100%達成バッジ */}
        {badges && badges.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🏆</span>100%達成バッジ
            </h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {badges.map((badge) => {
                const challenge = badge.challenges as unknown as { title: string; thumbnail_url: string | null; category: string | null } | null
                return (
                  <div key={badge.id} className="shrink-0 w-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                        <span className="text-3xl">🏆</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium mt-1.5 line-clamp-2 leading-tight">
                      {challenge?.title ?? '不明'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 参加中のチャレンジ */}
        {activeChallenges.length > 0 && (
          <>
            <h3 className="font-bold text-gray-900 mb-3">参加中のチャレンジ</h3>
            <div className="space-y-3 mb-6">
              {activeChallenges.map((s) => (
                <Link
                  key={s.membershipId}
                  href={`/group/${s.groupId}`}
                  className="block bg-white rounded-2xl shadow-sm p-4 hover:bg-gray-50 transition-colors"
                >
                  {s.notStartedYet ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                        </div>
                        <div className="ml-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                            <span className="text-xl">⏳</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-600 font-semibold">
                          📅 {s.startDateLabel ? `${new Date(s.startDateLabel).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}から開始` : 'まもなく開始'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                        <span className={`text-sm font-bold ${s.rate >= 85 ? 'text-green-500' : s.rate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                          {s.rate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${s.rate >= 85 ? 'bg-green-500' : s.rate >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.max(s.rate, 2)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{s.checkinCount} / {s.durationDays}日</span>
                        <span>¥{s.depositAmount.toLocaleString()}</span>
                      </div>
                      {s.isOngoing && s.remainingMisses <= 0 && (
                        <div className={`mt-2 rounded-lg px-3 py-2 ${
                          !s.checkedInToday && s.remainingMissesIfCheckinToday >= 0
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <p className={`text-xs font-semibold ${
                            !s.checkedInToday && s.remainingMissesIfCheckinToday >= 0
                              ? 'text-orange-600'
                              : 'text-red-600'
                          }`}>
                            {!s.checkedInToday && s.remainingMissesIfCheckinToday >= 0
                              ? '📸 今日チェックインすればまだ間に合います！'
                              : s.remainingMisses < 0
                                ? '⛔ 達成率85%を下回っています…'
                                : '🚨 あと1日でもサボるとアウトです！'}
                          </p>
                        </div>
                      )}
                      {s.isOngoing && s.remainingMisses === 1 && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-yellow-700 font-semibold">⚠️ あと1回だけサボれます。油断禁物！</p>
                        </div>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}

        {/* チャレンジ履歴（過去） */}
        <h3 className="font-bold text-gray-900 mb-3">チャレンジ履歴</h3>
        {pastChallenges.length > 0 ? (
          <div className="space-y-3">
            {pastChallenges.map((s) => {
              const status = statusConfig[s.status as keyof typeof statusConfig]
              return (
                <div key={s.membershipId} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm flex-1 mr-2 truncate">
                      {s.title}
                    </h4>
                    {status && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${s.rate >= 85 ? 'bg-green-500' : s.rate >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.max(s.rate, 2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{s.checkinCount} / {s.durationDays}日（{s.rate}%）</span>
                    <span className={`font-medium ${s.depositAmount > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      ¥{s.depositAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    {new Date(s.joinedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })} 参加
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">まだ完了したチャレンジはありません</p>
          </div>
        )}

        {/* 作成したチャレンジ */}
        {createdChallenges && createdChallenges.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>📝</span>作成したチャレンジ
            </h3>
            <div className="space-y-2">
              {createdChallenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="block bg-white rounded-2xl shadow-sm p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{c.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{c.category}</span>
                        <span className="text-xs text-gray-400">{c.duration_days}日間</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          c.status === 'active' ? 'bg-green-100 text-green-700' :
                          c.status === 'deleted' ? 'bg-red-100 text-red-600' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {c.status === 'active' ? '公開中' : c.status === 'deleted' ? '削除済み' : c.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-300 ml-2">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
