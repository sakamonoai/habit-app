import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import CategoryTabs from '@/components/CategoryTabs'
import CategoryIcons from '@/components/CategoryIcons'

const InstallBanner = dynamic(() => import('@/components/InstallBanner'))
const HowToUseGuide = dynamic(() => import('@/components/HowToUseGuide'))

type Challenge = {
  id: string
  title: string
  description: string | null
  duration_days: number
  deposit_amount: number
  max_members: number
  status: string
  category: string | null
  start_date: string | null
  created_at: string
}

const CARD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-blue-400 to-indigo-400',
  'from-green-400 to-teal-400',
  'from-purple-400 to-pink-400',
  'from-yellow-400 to-orange-400',
]

type Props = {
  searchParams: Promise<{ category?: string; schedule?: string }>
}

// カテゴリマッピング（タブ名 → DBのcategoryカラム値）
const CATEGORY_MAP: Record<string, string[]> = {
  '運動': ['運動'],
  '食習慣': ['食習慣'],
  '生活': ['生活', '朝活'],
  '勉強': ['勉強', '学習'],
  '趣味': ['趣味', '読書'],
}

export default async function ChallengesPage({ searchParams }: Props) {
  const { category, schedule } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // プロフィールとチャレンジを並列取得
  const profilePromise = supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('challenges_with_members')
    .select('*')
    .eq('status', 'active')

  if (category && category !== '全て' && CATEGORY_MAP[category]) {
    query = query.in('category', CATEGORY_MAP[category])
  }
  if (schedule === 'fixed') {
    query = query.eq('schedule_type', 'fixed').order('start_date', { ascending: true, nullsFirst: false })
  } else if (schedule === 'flexible') {
    query = query.eq('schedule_type', 'flexible').order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const [{ data: profile }, { data: challenges }] = await Promise.all([profilePromise, query])

  const challengesWithMembers = (challenges ?? []).map((challenge, index) => ({
    id: challenge.id as string,
    title: challenge.title as string,
    description: challenge.description as string | null,
    duration_days: challenge.duration_days as number,
    deposit_amount: challenge.deposit_amount as number,
    max_members: (challenge.max_group_size ?? challenge.max_members ?? 6) as number,
    status: challenge.status as string,
    category: challenge.category as string | null,
    start_date: challenge.start_date as string | null,
    created_at: challenge.created_at as string,
    created_by: challenge.created_by as string | null,
    memberCount: (challenge.member_count ?? 0) as number,
    avgRating: (challenge.avg_rating ?? null) as number | null,
    reviewCount: (challenge.review_count ?? 0) as number,
    thumbnail_url: (challenge.thumbnail_url ?? null) as string | null,
    schedule_type: (challenge.schedule_type ?? 'flexible') as string,
    end_date: (challenge.end_date ?? null) as string | null,
    gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
  }))

  const durationLabel = (days: number) => {
    if (days <= 7) return `${days}日間`
    if (days <= 14) return '2週間'
    if (days <= 31) return `${Math.round(days / 7)}週間`
    return `${Math.round(days / 30)}ヶ月`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー + カテゴリ */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">チャレンジ</h1>
          <Link
            href="/challenges/create"
            className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors active:scale-[0.98]"
          >
            + 作成
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-4 py-3">
          <CategoryIcons />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">

        {/* 使い方バナー */}
        <div className="px-4 py-2">
          <HowToUseGuide />
        </div>

        {/* 人気チャレンジ */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {schedule === 'fixed' ? '📅 募集中の' : schedule === 'flexible' ? '🔄 いつでも参加の' : ''}
            {category && category !== '全て' ? category : schedule ? '' : '人気'}チャレンジ
          </h2>
          <span className="text-sm text-gray-400">全{challengesWithMembers.length}件</span>
        </div>

        {/* カテゴリタブ */}
        <div className="px-4 pb-3">
          <CategoryTabs />
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
                <div className={`relative aspect-[4/5] ${challenge.thumbnail_url ? 'bg-gray-100' : `bg-gradient-to-br ${challenge.gradient}`} rounded-2xl overflow-hidden`}>
                  {challenge.thumbnail_url ? (
                    <Image src={challenge.thumbnail_url} alt={challenge.title} fill className="object-cover" sizes="(max-width: 512px) 50vw, 256px" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-30">
                        {challenge.title.includes('朝活') ? '☀️' :
                         challenge.title.includes('筋トレ') || challenge.title.includes('運動') ? '💪' :
                         challenge.title.includes('勉強') || challenge.title.includes('読書') ? '📚' : '🔥'}
                      </span>
                    </div>
                  )}
                  {/* 参加者数 */}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <span>👤</span> {challenge.memberCount}人
                  </div>
                  {/* 締切バッジ */}
                  {challenge.schedule_type === 'fixed' && challenge.start_date && (() => {
                    const start = new Date(challenge.start_date!)
                    const now = new Date()
                    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysUntil > 7) return null
                    return (
                      <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-lg font-bold ${daysUntil <= 1 ? 'bg-red-500' : daysUntil <= 3 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                        {daysUntil <= 0 ? '開催中' : daysUntil === 1 ? '明日開始！' : `あと${daysUntil}日`}
                      </div>
                    )
                  })()}
                </div>
                {/* カード情報 */}
                <div className="pt-2 pb-1">
                  <p className={`text-xs font-semibold ${challenge.created_by ? 'text-blue-500' : 'text-orange-500'}`}>
                    {challenge.created_by ? 'ユーザー作成' : '公式チャレンジ'}
                  </p>
                  <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-1">{challenge.title}</h3>
                  {challenge.avgRating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs font-semibold text-gray-700">{challenge.avgRating}</span>
                      <span className="text-xs text-gray-400">({challenge.reviewCount})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">毎日</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{durationLabel(challenge.duration_days)}</span>
                    {challenge.schedule_type === 'fixed' && challenge.start_date && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
                        {new Date(challenge.start_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}〜
                      </span>
                    )}
                  </div>
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
