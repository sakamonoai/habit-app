import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ChallengeList from '@/components/ChallengeList'
import { TRIAL_MODE } from '@/lib/trial-mode'

const InstallBanner = dynamic(() => import('@/components/InstallBanner'))
const HowToUseGuide = dynamic(() => import('@/components/HowToUseGuide'))
const TrialCampaignPopup = dynamic(() => import('@/components/TrialCampaignPopup'))

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

  // 作成者のプロフィールを取得
  const creatorIds = [...new Set((challenges ?? []).map(c => c.created_by).filter(Boolean))]
  const { data: creators } = creatorIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', creatorIds)
    : { data: [] }
  const creatorMap = new Map((creators ?? []).map(c => [c.id, c]))

  const allChallenges = (challenges ?? []).map((challenge, index) => {
    const creator = creatorMap.get(challenge.created_by)
    return {
      id: challenge.id as string,
      title: challenge.title as string,
      duration_days: challenge.duration_days as number,
      category: challenge.category as string | null,
      start_date: challenge.start_date as string | null,
      created_by: challenge.created_by as string | null,
      creator_nickname: (creator?.nickname ?? null) as string | null,
      creator_avatar_url: (creator?.avatar_url ?? null) as string | null,
      memberCount: (challenge.member_count ?? 0) as number,
      avgRating: (challenge.avg_rating ?? null) as number | null,
      reviewCount: (challenge.review_count ?? 0) as number,
      thumbnail_url: (challenge.thumbnail_url ?? null) as string | null,
      schedule_type: (challenge.schedule_type ?? 'flexible') as string,
      is_official: (challenge.is_official ?? false) as boolean,
      reward_title: (challenge.reward_title ?? null) as string | null,
      gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
    }
  })

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
        {/* お試しキャンペーンバナー */}
        {TRIAL_MODE && (
          <div className="px-4 pt-3">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full" />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="font-bold text-sm">お試しキャンペーン中！</p>
                  <p className="text-white/90 text-xs">デポジット無料・カード登録不要で参加OK</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-2">
          <HowToUseGuide />
        </div>

        <ChallengeList challenges={allChallenges} />
      </main>
      <InstallBanner />
      {TRIAL_MODE && <TrialCampaignPopup />}
    </div>
  )
}
