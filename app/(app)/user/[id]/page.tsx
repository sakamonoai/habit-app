import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  params: Promise<{ id: string }>
}

const SNS_CONFIG: Record<string, { label: string; prefix: string }> = {
  twitter: { label: 'X', prefix: 'https://x.com/' },
  instagram: { label: 'Instagram', prefix: 'https://instagram.com/' },
  youtube: { label: 'YouTube', prefix: '' },
  tiktok: { label: 'TikTok', prefix: 'https://tiktok.com/@' },
  website: { label: 'Web', prefix: '' },
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // プロフィール、バッジ、チェックインを並列取得
  const [{ data: profile }, { data: badges }, { data: checkins }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('badges').select('*, challenges(title)').eq('user_id', id).order('earned_at', { ascending: false }),
    supabase.from('checkins').select('*, profiles!checkins_user_id_profiles_fkey(nickname)').eq('user_id', id).order('checked_in_at', { ascending: false }).limit(20),
  ])

  if (!profile) notFound()

  const snsLinks = (profile.sns_links ?? {}) as Record<string, string>
  const hasSns = Object.values(snsLinks).some(v => v && v.trim())

  const getSnsUrl = (key: string, value: string): string => {
    const config = SNS_CONFIG[key]
    if (!config) return value
    if (key === 'website' || key === 'youtube') return value.startsWith('http') ? value : `https://${value}`
    const handle = value.replace(/^@/, '')
    return `${config.prefix}${handle}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={undefined} className="text-gray-400">
            <Link href="/home">← 戻る</Link>
          </button>
          <h1 className="font-semibold text-gray-900">プロフィール</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 text-center">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {(profile.nickname ?? '?')[0]}
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-900">{profile.nickname ?? '匿名'}</h2>
          {profile.bio && (
            <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
          )}

          {/* SNSリンク */}
          {hasSns && (
            <div className="flex items-center justify-center gap-3 mt-3">
              {Object.entries(snsLinks).filter(([, v]) => v && v.trim()).map(([key, value]) => (
                <a
                  key={key}
                  href={getSnsUrl(key, value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {SNS_CONFIG[key]?.label ?? key}
                </a>
              ))}
            </div>
          )}

          {/* バッジ */}
          {badges && badges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">獲得バッジ</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {badges.map((badge) => (
                  <div key={badge.id} className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 flex items-center gap-1">
                    <span className="text-sm">🏆</span>
                    <span className="text-xs text-yellow-700 font-medium">
                      {(badge.challenges as { title: string } | null)?.title ?? 'チャレンジ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 投稿一覧 */}
        <h3 className="font-bold text-gray-900 mb-3">投稿一覧</h3>
        {checkins && checkins.length > 0 ? (
          <div className="space-y-3">
            {checkins.map((checkin) => (
              <div key={checkin.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-400">
                    {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {checkin.photo_url && (
                  <div className="relative w-full rounded-xl mb-2 overflow-hidden" style={{ maxHeight: '288px' }}>
                    <Image
                      src={checkin.photo_url}
                      alt="チェックイン"
                      width={500}
                      height={500}
                      className="w-full object-cover"
                      loading="lazy"
                      sizes="(max-width: 512px) 100vw, 512px"
                    />
                  </div>
                )}
                {checkin.comment && (
                  <p className="text-sm text-gray-600">{checkin.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm">まだ投稿がありません</p>
          </div>
        )}
      </main>
    </div>
  )
}
