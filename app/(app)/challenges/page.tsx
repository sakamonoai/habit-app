import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ChallengeList from '@/components/ChallengeList'

const InstallBanner = dynamic(() => import('@/components/InstallBanner'))
const HowToUseGuide = dynamic(() => import('@/components/HowToUseGuide'))

const CARD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-blue-400 to-indigo-400',
  'from-green-400 to-teal-400',
  'from-purple-400 to-pink-400',
  'from-yellow-400 to-orange-400',
]

export default async function ChallengesPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  // 全チャレンジを1クエリで取得（フィルタはクライアント側で即座に処理）
  const { data: challenges } = await supabase
    .from('challenges_with_members')
    .select('*')
    .eq('status', 'active')
    .neq('status', 'suspended')
    .order('created_at', { ascending: false })

  const allChallenges = (challenges ?? []).map((challenge, index) => ({
    id: challenge.id as string,
    title: challenge.title as string,
    duration_days: challenge.duration_days as number,
    category: challenge.category as string | null,
    start_date: challenge.start_date as string | null,
    created_by: challenge.created_by as string | null,
    memberCount: (challenge.member_count ?? 0) as number,
    avgRating: (challenge.avg_rating ?? null) as number | null,
    reviewCount: (challenge.review_count ?? 0) as number,
    thumbnail_url: (challenge.thumbnail_url ?? null) as string | null,
    schedule_type: (challenge.schedule_type ?? 'flexible') as string,
    gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
  }))

  return (
    <div className="min-h-screen bg-white">
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
      </header>

      <main className="max-w-lg mx-auto pb-24">
        <div className="px-4 py-2">
          <HowToUseGuide />
        </div>

        <ChallengeList challenges={allChallenges} />
      </main>
      <InstallBanner />
    </div>
  )
}
