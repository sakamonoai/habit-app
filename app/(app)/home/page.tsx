import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactionButton from '@/components/ReactionButton'
import TimelineFilter from '@/components/TimelineFilter'
import PullToRefresh from '@/components/PullToRefresh'
import PhotoViewer from '@/components/PhotoViewer'
import { getJstDiffLabel } from '@/lib/timezone'
import NotificationBell from '@/components/NotificationBell'

const CHALLENGE_COLORS = [
  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
  { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-400' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-400' },
]

type Props = {
  searchParams: Promise<{ challenge?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { challenge: filterChallengeId } = await searchParams
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  // 閲覧ユーザーのタイムゾーンを取得
  const { data: myProfile } = await supabase.from('profiles').select('timezone').eq('id', user.id).single()
  const viewerTz = myProfile?.timezone || 'Asia/Tokyo'

  // 1段目: メンバーシップ + チャレンジ情報をjoinで一括取得
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, challenge_id, challenges(id, title)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
            <h1 className="text-2xl font-bold text-gray-900">タイムライン</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-lg font-bold text-gray-900 mb-2">タイムラインはまだ空です</p>
          <p className="text-sm text-gray-500 mb-1">チャレンジに参加すると、</p>
          <p className="text-sm text-gray-500 mb-6">仲間の投稿がここに表示されます。</p>
          <Link href="/challenges" className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors">
            チャレンジを探す
          </Link>
          <div className="mt-8 bg-gray-50 rounded-2xl p-5 text-left max-w-xs mx-auto">
            <p className="text-xs font-semibold text-gray-700 mb-3">タイムラインとは？</p>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex gap-2"><span>📸</span><span>参加中のチャレンジの仲間の投稿が流れてきます</span></li>
              <li className="flex gap-2"><span>👍</span><span>リアクションで仲間を応援できます</span></li>
              <li className="flex gap-2"><span>🔥</span><span>みんなの頑張りを見てモチベーションアップ！</span></li>
            </ul>
          </div>
        </main>
      </div>
    )
  }

  // チャレンジマップをjoin結果から構築（別クエリ不要）
  const challengeMap = new Map<string, { title: string; color: typeof CHALLENGE_COLORS[0] }>()
  const groupToChallengeMap = new Map<string, string>()
  let colorIdx = 0
  const seenChallenges = new Set<string>()
  for (const m of memberships) {
    groupToChallengeMap.set(m.group_id, m.challenge_id)
    if (!seenChallenges.has(m.challenge_id)) {
      seenChallenges.add(m.challenge_id)
      const c = m.challenges as unknown as { id: string; title: string } | null
      challengeMap.set(m.challenge_id, {
        title: c?.title ?? '不明',
        color: CHALLENGE_COLORS[colorIdx % CHALLENGE_COLORS.length],
      })
      colorIdx++
    }
  }

  const groupIds = memberships.map(m => m.group_id)
  const targetGroupIds = filterChallengeId
    ? memberships.filter(m => m.challenge_id === filterChallengeId).map(m => m.group_id)
    : groupIds

  // 2段目: チェックイン + profiles + reactions を全てjoinで1クエリ
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, profiles!checkins_user_id_profiles_fkey(nickname, avatar_url, timezone), reactions(emoji, user_id)')
    .in('group_id', targetGroupIds)
    .order('checked_in_at', { ascending: false })
    .limit(30)

  // リアクションをcheckin_idでグループ化
  const getReactionsForCheckin = (checkin: { reactions?: { emoji: string; user_id: string }[] }) => {
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>()
    for (const r of checkin.reactions ?? []) {
      const existing = emojiMap.get(r.emoji) ?? { count: 0, hasReacted: false }
      existing.count++
      if (r.user_id === user!.id) existing.hasReacted = true
      emojiMap.set(r.emoji, existing)
    }
    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }))
  }

  // フィルタ用のチャレンジリスト
  const filterOptions = Array.from(challengeMap.entries()).map(([id, info]) => ({
    id,
    title: info.title,
    color: info.color,
  }))

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">タイムライン</h1>
            <NotificationBell />
          </div>
          <TimelineFilter challenges={filterOptions} />
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        <PullToRefresh>
        {checkins && checkins.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {checkins.map((checkin) => {
              const challengeId = groupToChallengeMap.get(checkin.group_id) ?? ''
              const challengeInfo = challengeMap.get(challengeId)
              return (
                <div key={checkin.id} className="px-4 py-4">
                  {challengeInfo && (
                    <Link
                      href={`/group/${checkin.group_id}`}
                      className={`inline-flex items-center gap-1.5 ${challengeInfo.color.bg} ${challengeInfo.color.text} text-xs font-medium px-2.5 py-1 rounded-full mb-2`}
                    >
                      <span className={`w-2 h-2 rounded-full ${challengeInfo.color.dot}`} />
                      {challengeInfo.title}
                    </Link>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/user/${checkin.user_id}`} className="shrink-0">
                      {checkin.profiles?.avatar_url ? (
                        <Image src={checkin.profiles.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {(checkin.profiles?.nickname ?? '?')[0]}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/user/${checkin.user_id}`} className="font-medium text-gray-900 text-sm hover:underline">
                          {checkin.profiles?.nickname ?? '匿名'}
                        </Link>
                        {(checkin.profiles?.timezone && checkin.profiles.timezone !== 'Asia/Tokyo') && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">🌐 {getJstDiffLabel(checkin.profiles.timezone)}時差あり</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          timeZone: viewerTz
                        })}
                      </p>
                    </div>
                  </div>

                  {checkin.photo_url && (
                    <PhotoViewer src={checkin.photo_url} />
                  )}

                  {checkin.comment && (
                    <p className="text-sm text-gray-600 mb-1">{checkin.comment}</p>
                  )}

                  <ReactionButton
                    checkinId={checkin.id}
                    checkinUserId={checkin.user_id}
                    initialReactions={getReactionsForCheckin(checkin)}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm">まだ投稿がありません</p>
          </div>
        )}
        </PullToRefresh>
      </main>
    </div>
  )
}
