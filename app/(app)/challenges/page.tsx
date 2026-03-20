import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

const CATEGORY_ICONS = [
  { label: '運動', emoji: '🏃', color: 'bg-pink-50' },
  { label: 'ルーティン', emoji: '📅', color: 'bg-blue-50' },
  { label: '食習慣', emoji: '🥗', color: 'bg-green-50' },
  { label: '読書', emoji: '📚', color: 'bg-yellow-50' },
  { label: '早起き', emoji: '☀️', color: 'bg-orange-50' },
  { label: '勉強', emoji: '✏️', color: 'bg-purple-50' },
]

const CARD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-blue-400 to-indigo-400',
  'from-green-400 to-teal-400',
  'from-purple-400 to-pink-400',
  'from-yellow-400 to-orange-400',
]

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

  // 各チャレンジの参加者数を取得
  const challengesWithMembers = await Promise.all(
    (challenges ?? []).map(async (challenge, index) => {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('challenge_id', challenge.id)
        .maybeSingle()

      let memberCount = 0
      if (group) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
        memberCount = count ?? 0
      }

      return { ...challenge, memberCount, gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }
    })
  )

  const durationLabel = (days: number) => {
    if (days <= 7) return `${days}日間`
    if (days <= 14) return '2週間'
    if (days <= 31) return `${Math.round(days / 7)}週間`
    return `${Math.round(days / 30)}ヶ月`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">チャレンジ</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{profile?.nickname}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* カテゴリアイコン */}
        <div className="px-4 py-3">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {CATEGORY_ICONS.map((cat) => (
              <div key={cat.label} className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-2xl`}>
                  {cat.emoji}
                </div>
                <span className="text-xs text-gray-600">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 使い方バナー */}
        <div className="px-4 py-2">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">🎯</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">チャレンジの使い方</p>
                <p className="text-xs text-gray-400">チャレンジって何？どうやるの？</p>
              </div>
            </div>
            <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg font-medium">見る</span>
          </div>
        </div>

        {/* 人気チャレンジ */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">人気チャレンジ</h2>
          <span className="text-sm text-gray-400">全{challengesWithMembers.length}件</span>
        </div>

        {/* カテゴリタブ */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['全て', '運動', '食習慣', '生活', '勉強', '趣味'].map((tab, i) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  i === 0
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* チャレンジカードグリッド */}
        {challengesWithMembers.length > 0 ? (
          <div className="px-4 grid grid-cols-2 gap-3">
            {challengesWithMembers.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="block group"
              >
                {/* カード画像エリア */}
                <div className={`relative aspect-[4/5] bg-gradient-to-br ${challenge.gradient} rounded-2xl overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-30">
                      {challenge.title.includes('朝活') ? '☀️' :
                       challenge.title.includes('筋トレ') || challenge.title.includes('運動') ? '💪' :
                       challenge.title.includes('勉強') || challenge.title.includes('読書') ? '📚' : '🔥'}
                    </span>
                  </div>
                  {/* 参加者数 */}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <span>👤</span> {challenge.memberCount}人
                  </div>
                </div>
                {/* カード情報 */}
                <div className="pt-2 pb-1">
                  <p className="text-orange-500 text-xs font-semibold">公式チャレンジ</p>
                  <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-1">{challenge.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">毎日</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{durationLabel(challenge.duration_days)}</span>
                  </div>
                  <p className="text-xs text-orange-500 mt-1.5 font-medium">¥{challenge.deposit_amount.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
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
