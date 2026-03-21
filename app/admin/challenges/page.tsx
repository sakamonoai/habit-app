import { requireAdmin } from '@/lib/admin-guard'
import Link from 'next/link'
import { ChallengeActions } from '@/components/admin/ChallengeActions'

export default async function AdminChallengesPage() {
  const { supabase } = await requireAdmin()

  // チャレンジ一覧を取得（最新順、最大100件）
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // チャレンジごとの参加者数・達成者数・没収者数を取得
  const { data: memberStats } = await supabase
    .from('group_members')
    .select('challenge_id, status')

  // 集計マップを作成
  const statsMap = new Map<
    string,
    { total: number; completed: number; forfeited: number; active: number }
  >()

  if (memberStats) {
    for (const m of memberStats) {
      const existing = statsMap.get(m.challenge_id) || {
        total: 0,
        completed: 0,
        forfeited: 0,
        active: 0,
      }
      existing.total += 1
      if (m.status === 'completed') existing.completed += 1
      if (m.status === 'forfeited') existing.forfeited += 1
      if (m.status === 'active') existing.active += 1
      statsMap.set(m.challenge_id, existing)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  // サマリー統計
  const totalCount = challenges?.length ?? 0
  let activeCount = 0
  let doneCount = 0

  if (challenges) {
    for (const c of challenges) {
      const stats = statsMap.get(c.id)
      const isBetweenDates =
        c.start_date && c.end_date && c.start_date <= today && today <= c.end_date
      const hasActiveMembers = stats && stats.active > 0

      if (isBetweenDates || hasActiveMembers) {
        activeCount += 1
      } else if (
        (c.end_date && c.end_date < today) ||
        (stats && stats.total > 0 && stats.active === 0)
      ) {
        doneCount += 1
      }
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">チャレンジ管理</h1>
        <Link
          href="/admin/challenges/create"
          className="bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
        >
          + 公式チャレンジを作成
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">総チャレンジ数</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
          <p className="text-sm text-green-600">進行中</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">完了済み</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{doneCount}</p>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">タイトル</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">期間</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">参加者 / 定員</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">デポジット</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">達成者</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">没収者</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">日程</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">作成日</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!challenges || challenges.length === 0) && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    チャレンジがありません
                  </td>
                </tr>
              )}
              {challenges?.map((c, i) => {
                const stats = statsMap.get(c.id) || {
                  total: 0,
                  completed: 0,
                  forfeited: 0,
                  active: 0,
                }
                const depositLabel =
                  c.deposit_type === 'fixed'
                    ? `${Number(c.deposit_amount).toLocaleString()}円`
                    : '選択式'
                const scheduleLabel =
                  c.schedule_type === 'fixed' && c.start_date && c.end_date
                    ? `${c.start_date} ~ ${c.end_date}`
                    : '随時開催'
                const createdDate = c.created_at
                  ? new Date(c.created_at).toLocaleDateString('ja-JP')
                  : '-'

                return (
                  <tr
                    key={c.id}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/challenges/${c.id}`}
                        className="text-orange-600 hover:text-orange-800 font-medium hover:underline"
                      >
                        {c.title}
                      </Link>
                      {c.is_official && (
                        <span className="ml-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                          公式
                        </span>
                      )}
                      {c.status === 'suspended' && (
                        <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          非公開
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {c.duration_days}日間
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {stats.total} / {c.max_group_size ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {depositLabel}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-green-600 font-medium">
                        {stats.completed}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-red-500 font-medium">
                        {stats.forfeited}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                      {scheduleLabel}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {createdDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChallengeActions
                        challengeId={c.id}
                        currentStatus={c.status}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
