import { requireAdmin } from '@/lib/admin-guard'

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin()

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // 7日前の日付
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [
    totalUsersRes,
    activeParticipantsRes,
    completedMembersRes,
    feeRevenueRes,
    forfeitedRevenueRes,
    pendingReportsRes,
    recentSignupsRes,
    recentActivityRes,
  ] = await Promise.all([
    // 1. 総ユーザー数
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),

    // 2. アクティブ参加者数（現在進行中のチャレンジに参加している人数）
    supabase
      .from('group_members')
      .select('user_id, challenges!inner(start_date, end_date)', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('challenges.start_date', today)
      .gte('challenges.end_date', today),

    // 3. 平均達成率用: 完了したメンバーのチェックイン数とチャレンジ期間
    supabase
      .from('group_members')
      .select(`
        id,
        status,
        challenges(duration_days),
        checkins(count)
      `)
      .in('status', ['completed', 'forfeited']),

    // 4a. 手数料売上（fee_payment_intent_idが存在 = 手数料支払い済み）
    supabase
      .from('group_members')
      .select('deposit_amount')
      .not('fee_payment_intent_id', 'is', null),

    // 4b. 没収デポジット売上
    supabase
      .from('group_members')
      .select('deposit_amount')
      .eq('status', 'forfeited'),

    // 5. 未対応の報告
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // 6. 新規登録推移（過去7日）
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgoStr),

    // 7. 最近の参加アクティビティ
    supabase
      .from('group_members')
      .select(`
        id,
        deposit_amount,
        joined_at,
        profiles!group_members_user_id_fkey(nickname),
        challenges(title)
      `)
      .order('joined_at', { ascending: false })
      .limit(10),
  ])

  // KPI計算
  const totalUsers = totalUsersRes.count ?? 0
  const activeParticipants = activeParticipantsRes.count ?? 0
  const pendingReports = pendingReportsRes.count ?? 0

  // 平均達成率
  let averageRate = 0
  if (completedMembersRes.data && completedMembersRes.data.length > 0) {
    const rates = completedMembersRes.data.map((m: any) => {
      const durationDays = (m.challenges as any)?.duration_days ?? 1
      const checkinCount = Array.isArray(m.checkins) ? m.checkins.length : ((m.checkins as any)?.[0]?.count ?? 0)
      return Math.min((checkinCount / durationDays) * 100, 100)
    })
    averageRate = rates.reduce((sum: number, r: number) => sum + r, 0) / rates.length
  }

  // 売上計算
  // 手数料: 各参加の手数料（参加費の一定割合として100円固定と仮定するか、実データから）
  // ここでは fee_payment_intent_id がある参加者数 × 100円（手数料固定額）で概算
  const feeCount = feeRevenueRes.data?.length ?? 0
  const feeRevenue = feeCount * 100 // 手数料100円/件

  const forfeitedRevenue = forfeitedRevenueRes.data?.reduce(
    (sum: number, m: any) => sum + (m.deposit_amount ?? 0), 0
  ) ?? 0

  const totalRevenue = feeRevenue + forfeitedRevenue

  // 新規登録推移（日別集計）
  const signupsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    signupsByDay[d.toISOString().split('T')[0]] = 0
  }
  recentSignupsRes.data?.forEach((p: any) => {
    const day = p.created_at?.split('T')[0]
    if (day && signupsByDay[day] !== undefined) {
      signupsByDay[day]++
    }
  })

  // 最近のアクティビティ
  const recentActivity = recentActivityRes.data ?? []

  // KPIカード定義
  const kpis = [
    {
      label: '総ユーザー数',
      value: totalUsers.toLocaleString(),
      sub: '登録済みアカウント',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    {
      label: 'アクティブ参加者',
      value: activeParticipants.toLocaleString(),
      sub: '進行中チャレンジ',
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    {
      label: '平均達成率',
      value: `${averageRate.toFixed(1)}%`,
      sub: '完了チャレンジ全体',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    {
      label: '売上',
      value: `¥${totalRevenue.toLocaleString()}`,
      sub: `手数料 ¥${feeRevenue.toLocaleString()} + 没収 ¥${forfeitedRevenue.toLocaleString()}`,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    {
      label: '未対応の報告',
      value: pendingReports.toLocaleString(),
      sub: '要確認',
      bg: pendingReports > 0 ? 'bg-red-50' : 'bg-gray-50',
      text: pendingReports > 0 ? 'text-red-700' : 'text-gray-700',
      border: pendingReports > 0 ? 'border-red-200' : 'border-gray-200',
    },
  ]

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">
          サービスの概況をリアルタイムで確認できます
        </p>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border ${kpi.border} ${kpi.bg} p-5 transition-shadow hover:shadow-md`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className={`text-2xl font-bold mt-2 ${kpi.text}`}>
              {kpi.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 新規登録推移 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          新規登録推移（過去7日間）
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500">日付</th>
                <th className="text-right py-2 font-medium text-gray-500">新規登録数</th>
                <th className="text-left py-2 pl-4 font-medium text-gray-500 w-1/2">
                  {/* バー表示用 */}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(signupsByDay).map(([date, count]) => {
                const maxCount = Math.max(...Object.values(signupsByDay), 1)
                const barWidth = (count / maxCount) * 100
                return (
                  <tr key={date} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">
                      {formatDate(date)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">
                      {count}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-400 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          最近の参加アクティビティ
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            まだアクティビティがありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">ユーザー</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">チャレンジ</th>
                  <th className="text-right py-2 pr-4 font-medium text-gray-500">デポジット</th>
                  <th className="text-left py-2 font-medium text-gray-500">参加日</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-gray-900 font-medium whitespace-nowrap">
                      {(item.profiles as any)?.nickname ?? '不明'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700 max-w-[200px] truncate">
                      {(item.challenges as any)?.title ?? '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-gray-900 whitespace-nowrap">
                      ¥{(item.deposit_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-gray-500 whitespace-nowrap">
                      {item.joined_at ? formatDate(item.joined_at.split('T')[0]) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/** 日付文字列を "M月D日（曜日）" 形式にフォーマット */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日（${weekday}）`
}
