import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  // 参加中のチャレンジ一覧
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, groups(id, challenge_id, challenges(title, duration_days, start_date))')
    .eq('user_id', user.id)

  // 各チャレンジのチェックイン数を取得
  const challengeStats = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', m.id)

      const challenge = m.groups?.challenges
      const durationDays = challenge?.duration_days ?? 1
      const checkinCount = count ?? 0
      const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)

      return {
        membershipId: m.id,
        groupId: m.groups?.id,
        title: challenge?.title ?? '不明',
        durationDays,
        checkinCount,
        rate,
        depositAmount: m.deposit_amount,
        status: m.status,
      }
    })
  )

  const totalCheckins = challengeStats.reduce((sum, s) => sum + s.checkinCount, 0)
  const avgRate = challengeStats.length > 0
    ? Math.round(challengeStats.reduce((sum, s) => sum + s.rate, 0) / challengeStats.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
          <Link href="/challenges" className="text-sm text-orange-500">チャレンジ一覧</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* プロフィール */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
            🔥
          </div>
          <h2 className="text-lg font-bold text-gray-900">{profile?.nickname ?? 'ゲスト'}</h2>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{challengeStats.length}</p>
            <p className="text-xs text-gray-500">参加中</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{totalCheckins}</p>
            <p className="text-xs text-gray-500">総チェックイン</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{avgRate}%</p>
            <p className="text-xs text-gray-500">平均達成率</p>
          </div>
        </div>

        {/* 参加チャレンジ一覧 */}
        <h3 className="font-semibold text-gray-900 mb-3">参加中のチャレンジ</h3>
        {challengeStats.length > 0 ? (
          <div className="space-y-3">
            {challengeStats.map((s) => (
              <Link
                key={s.membershipId}
                href={`/group/${s.groupId}`}
                className="block bg-white rounded-2xl shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                  <span className={`text-sm font-bold ${s.rate >= 85 ? 'text-green-500' : s.rate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                    {s.rate}%
                  </span>
                </div>
                {/* プログレスバー */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${s.rate >= 85 ? 'bg-green-500' : s.rate >= 50 ? 'bg-orange-500' : 'bg-red-400'}`}
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{s.checkinCount} / {s.durationDays}日</span>
                  <span>¥{s.depositAmount.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-sm">まだチャレンジに参加していません</p>
            <Link href="/challenges" className="text-orange-500 text-sm mt-2 inline-block">チャレンジを探す →</Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
