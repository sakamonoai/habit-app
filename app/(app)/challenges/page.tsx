import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import BottomNav from '@/components/BottomNav'
import InstallBanner from '@/components/InstallBanner'

type Challenge = {
  id: string
  title: string
  description: string | null
  duration_days: number
  deposit_amount: number
  max_members: number
  status: string
  start_date: string | null
  created_at: string
}

export default async function ChallengesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const durationLabel = (days: number) => {
    if (days <= 7) return `${days}日間`
    if (days <= 31) return `${Math.round(days / 7)}週間`
    return `${Math.round(days / 30)}ヶ月`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🔥 ハビチャレ</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{profile?.nickname ?? 'ゲスト'}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* ウェルカムバナー */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 mb-6 text-white">
          <p className="text-sm opacity-90 mb-1">こんにちは、{profile?.nickname ?? 'ゲスト'}さん！</p>
          <h2 className="text-xl font-bold">今日も習慣を積み上げよう</h2>
          <p className="text-sm opacity-80 mt-1">チャレンジに参加してデポジットを守れ！</p>
        </div>

        {/* チャレンジ一覧 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">参加できるチャレンジ</h3>
          <span className="text-sm text-gray-400">{challenges?.length ?? 0}件</span>
        </div>

        {challenges && challenges.length > 0 ? (
          <div className="space-y-3">
            {challenges.map((challenge: Challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{challenge.title}</h4>
                    {challenge.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium">
                        {durationLabel(challenge.duration_days)}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                        最大{challenge.max_members}人
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-orange-500">
                      ¥{challenge.deposit_amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">デポジット</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏃</p>
            <p className="text-sm">現在参加できるチャレンジはありません</p>
          </div>
        )}
      </main>
      <InstallBanner />
      <BottomNav />
    </div>
  )
}
