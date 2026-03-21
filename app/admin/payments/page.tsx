import { requireAdmin } from '@/lib/admin-guard'

export default async function AdminPaymentsPage() {
  const { supabase } = await requireAdmin()

  // --- 全メンバーデータ取得（サマリー計算用） ---
  const { data: allMembers } = await supabase
    .from('group_members')
    .select('deposit_amount, status')

  const feeTotal = (allMembers ?? []).reduce(
    (sum, m) => sum + (m.deposit_amount ?? 0) * 0.1,
    0
  )
  const forfeitedTotal = (allMembers ?? [])
    .filter((m) => m.status === 'forfeited')
    .reduce((sum, m) => sum + (m.deposit_amount ?? 0), 0)
  const totalRevenue = feeTotal + forfeitedTotal
  const activePending = (allMembers ?? [])
    .filter((m) => m.status === 'active')
    .reduce((sum, m) => sum + (m.deposit_amount ?? 0), 0)

  // --- 決済一覧（直近50件） ---
  const { data: payments } = await supabase
    .from('group_members')
    .select(`
      id,
      deposit_amount,
      status,
      joined_at,
      user_id,
      challenge_id,
      challenges ( title ),
      profiles:user_id ( nickname )
    `)
    .order('joined_at', { ascending: false })
    .limit(50)

  const fmt = (n: number) =>
    n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })

  const statusLabel: Record<string, { text: string; cls: string }> = {
    active: {
      text: 'アクティブ',
      cls: 'bg-blue-100 text-blue-800',
    },
    completed: {
      text: '達成',
      cls: 'bg-green-100 text-green-800',
    },
    forfeited: {
      text: '没収',
      cls: 'bg-red-100 text-red-800',
    },
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">決済・売上管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          売上サマリーと決済履歴を確認できます
        </p>
      </div>

      {/* 売上サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 手数料収入 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            手数料収入合計
          </p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {fmt(feeTotal)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            デポジットの10%
          </p>
        </div>

        {/* 没収デポジット */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            没収デポジット合計
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {fmt(forfeitedTotal)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            未達成者のデポジット
          </p>
        </div>

        {/* 総売上 */}
        <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm ring-1 ring-orange-100">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
            総売上
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {fmt(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            手数料 + 没収デポジット
          </p>
        </div>

        {/* アクティブ保留中 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            アクティブ保留中
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {fmt(activePending)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            オーソリ中（未確定）
          </p>
        </div>
      </div>

      {/* 決済一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">決済一覧</h2>
          <p className="text-xs text-gray-500 mt-0.5">直近50件を表示</p>
        </div>

        {/* PC テーブル */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">ユーザー</th>
                <th className="px-5 py-3">チャレンジ</th>
                <th className="px-5 py-3 text-right">デポジット額</th>
                <th className="px-5 py-3 text-right">手数料</th>
                <th className="px-5 py-3 text-center">ステータス</th>
                <th className="px-5 py-3">参加日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(payments ?? []).map((p: any) => {
                const deposit = p.deposit_amount ?? 0
                const fee = deposit * 0.1
                const badge = statusLabel[p.status] ?? {
                  text: p.status,
                  cls: 'bg-gray-100 text-gray-800',
                }
                const nickname =
                  (p.profiles as any)?.nickname ?? '不明'
                const challengeTitle =
                  (p.challenges as any)?.title ?? '—'
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {nickname}
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">
                      {challengeTitle}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-900 whitespace-nowrap">
                      {fmt(deposit)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600 whitespace-nowrap">
                      {fmt(fee)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {p.joined_at
                        ? new Date(p.joined_at).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                  </tr>
                )
              })}

              {(payments ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    決済データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* モバイル カード */}
        <div className="md:hidden divide-y divide-gray-100">
          {(payments ?? []).map((p: any) => {
            const deposit = p.deposit_amount ?? 0
            const fee = deposit * 0.1
            const badge = statusLabel[p.status] ?? {
              text: p.status,
              cls: 'bg-gray-100 text-gray-800',
            }
            const nickname =
              (p.profiles as any)?.nickname ?? '不明'
            const challengeTitle =
              (p.challenges as any)?.title ?? '—'
            return (
              <div key={p.id} className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {nickname}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {challengeTitle}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    デポジット: <span className="text-gray-900 font-medium">{fmt(deposit)}</span>
                  </span>
                  <span className="text-gray-500">
                    手数料: <span className="text-gray-700">{fmt(fee)}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {p.joined_at
                    ? new Date(p.joined_at).toLocaleDateString('ja-JP')
                    : '—'}
                </p>
              </div>
            )
          })}

          {(payments ?? []).length === 0 && (
            <div className="px-4 py-12 text-center text-gray-400 text-sm">
              決済データがありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
