import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDepositTier } from '@/lib/deposit-tier'

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
]

export default async function HistoryPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  // 全チャレンジ参加履歴を取得（active/completed/forfeited）
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, challenges(title, duration_days)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

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

  const totalDeposit = allMemberships.reduce((sum, m) => sum + (m.deposit_amount ?? 0), 0)
  const completedCount = allMemberships.filter(m => m.status === 'completed').length
  const tier = getDepositTier(totalDeposit)

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

  const statusConfig = {
    active: { label: '🔥 挑戦中', bg: 'bg-orange-100', text: 'text-orange-700' },
    completed: { label: '✅ 返金済み', bg: 'bg-green-100', text: 'text-green-700' },
    forfeited: { label: '❌ 没収', bg: 'bg-red-100', text: 'text-red-700' },
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
          <p className="text-white/70 text-xs mt-4 italic leading-relaxed">「{quote}」</p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* サマリー統計 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 -mt-4 mb-6">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-2">
              <p className="text-xl font-bold text-gray-900">¥{totalDeposit.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">累計デポジット</p>
            </div>
            <div className="text-center px-2">
              <p className="text-xl font-bold text-gray-900">{allMemberships.length}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">参加回数</p>
            </div>
            <div className="text-center px-2">
              <p className="text-xl font-bold text-green-500">{completedCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">返金成功</p>
            </div>
          </div>
        </div>

        {/* チャレンジ履歴 */}
        <h3 className="font-bold text-gray-900 mb-3">チャレンジ履歴</h3>
        {allMemberships.length > 0 ? (
          <div className="space-y-3">
            {allMemberships.map((m) => {
              const challenge = m.challenges as { title: string; duration_days: number } | null
              const durationDays = challenge?.duration_days ?? 1
              const checkinCount = checkinCounts[m.id] ?? 0
              const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)
              const depositAmount = m.deposit_amount ?? 0
              const status = statusConfig[m.status as keyof typeof statusConfig] ?? statusConfig.active

              return (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm flex-1 mr-2 truncate">
                      {challenge?.title ?? '不明'}
                    </h4>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* 達成率バー */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${rate >= 85 ? 'bg-green-500' : rate >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.max(rate, 2)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{checkinCount} / {durationDays}日（{rate}%）</span>
                    <span className={`font-medium ${depositAmount > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      ¥{depositAmount.toLocaleString()}
                    </span>
                  </div>

                  {depositAmount > 0 && (
                    <div className="mt-2 text-[10px] text-gray-400">
                      {new Date(m.joined_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })} 参加
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-sm">まだチャレンジ履歴がありません</p>
          </div>
        )}
      </main>
    </div>
  )
}
