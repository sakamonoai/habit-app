import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  // 参加中のメンバーシップ取得
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', user.id)

  // 各メンバーシップに対してチャレンジ情報とチェックイン数を取得
  const challengeStats = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('title, duration_days')
        .eq('id', m.challenge_id)
        .single()

      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', m.id)

      const durationDays = challenge?.duration_days ?? 1
      const checkinCount = count ?? 0
      const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)

      return {
        membershipId: m.id,
        groupId: m.group_id,
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
  const totalDeposit = challengeStats.reduce((sum, s) => sum + s.depositAmount, 0)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* プロフィール */}
        <div className="flex items-center gap-4 py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(profile?.nickname ?? '?')[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile?.nickname ?? 'ゲスト'}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-gray-900">{challengeStats.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">参加中</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-gray-900">{totalCheckins}</p>
              <p className="text-xs text-gray-400 mt-0.5">総チェックイン</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold text-orange-500">¥{totalDeposit.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">預けた金額</p>
            </div>
          </div>
        </div>

        {/* 参加チャレンジ一覧 */}
        <h3 className="font-bold text-gray-900 mb-3">参加中のチャレンジ</h3>
        {challengeStats.length > 0 ? (
          <div className="space-y-3">
            {challengeStats.map((s) => (
              <Link
                key={s.membershipId}
                href={`/group/${s.groupId}`}
                className="block bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
              >
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-sm">まだチャレンジに参加していません</p>
            <Link href="/challenges" className="text-orange-500 text-sm mt-2 inline-block font-medium">チャレンジを探す →</Link>
          </div>
        )}

        {/* メニュー */}
        <div className="mt-8 space-y-1">
          <h3 className="font-bold text-gray-900 mb-3">設定</h3>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">お知らせ</span>
              <span className="text-gray-300">→</span>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">利用規約</span>
              <span className="text-gray-300">→</span>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">お問い合わせ</span>
              <span className="text-gray-300">→</span>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
