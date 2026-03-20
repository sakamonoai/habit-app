import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default async function CheckinPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 参加中のグループ一覧を取得
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', user.id)

  const today = new Date().toISOString().split('T')[0]

  const groups = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('title, duration_days')
        .eq('id', m.challenge_id)
        .single()

      // 今日チェックイン済みか
      const { data: todayCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('member_id', m.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lt('checked_in_at', `${today}T23:59:59`)
        .maybeSingle()

      // チェックイン数
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', m.id)

      const rate = Math.min(Math.round(((count ?? 0) / (challenge?.duration_days ?? 1)) * 100), 100)

      return {
        groupId: m.group_id,
        memberId: m.id,
        title: challenge?.title ?? '不明',
        checkedInToday: !!todayCheckin,
        rate,
        checkinCount: count ?? 0,
        durationDays: challenge?.duration_days ?? 1,
      }
    })
  )

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">認証</h1>
          <p className="text-sm text-gray-400 mt-0.5">今日のチェックインを記録しよう</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {groups.length > 0 ? (
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm">参加中のチャレンジがありません</p>
            <Link href="/challenges" className="text-orange-500 text-sm mt-2 inline-block font-medium">
              チャレンジを探す →
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
