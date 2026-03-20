import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CheckinForm from '@/components/CheckinForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GroupTimelinePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // グループ情報取得
  const { data: group } = await supabase
    .from('groups')
    .select('*, challenges(*)')
    .eq('id', id)
    .single()

  if (!group) notFound()

  // 自分のメンバーIDを取得
  const { data: myMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  // 今日既にチェックインしたか確認
  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckin } = await supabase
    .from('checkins')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .gte('checked_in_at', `${today}T00:00:00`)
    .lt('checked_in_at', `${today}T23:59:59`)
    .maybeSingle()

  const hasCheckedInToday = !!todayCheckin

  // タイムライン取得（直近20件）
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, profiles(nickname)')
    .eq('group_id', id)
    .order('checked_in_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600">
            ← 戻る
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {group.challenges?.title ?? 'グループ'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* チェックイン状態 */}
        {hasCheckedInToday ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-green-700 font-semibold">今日のチェックイン完了！</p>
            <p className="text-green-600 text-sm">明日もがんばろう</p>
          </div>
        ) : (
          <CheckinForm groupId={id} memberId={myMember?.id ?? ''} />
        )}

        {/* タイムライン */}
        <h3 className="font-semibold text-gray-900 mb-3">みんなの投稿</h3>
        {checkins && checkins.length > 0 ? (
          <div className="space-y-3">
            {checkins.map((checkin) => (
              <div key={checkin.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">
                    🔥
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {checkin.profiles?.nickname ?? '匿名'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {checkin.photo_url && (
                  <img
                    src={checkin.photo_url}
                    alt="証拠写真"
                    className="w-full rounded-xl mb-2 object-cover max-h-64"
                  />
                )}
                {checkin.comment && (
                  <p className="text-sm text-gray-600">{checkin.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm">まだ投稿がありません。最初の投稿をしよう！</p>
          </div>
        )}
      </main>
    </div>
  )
}
