import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarkAsRead from '@/components/MarkAsRead'

export default async function NotificationsPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const items = notifications ?? []

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href="/home" className="text-gray-600 hover:text-gray-900 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">お知らせ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* ページを開いたら未読を既読にする */}
        <MarkAsRead />

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((n) => {
              const isAnnouncement = n.type === 'announcement'
              const emoji = isAnnouncement
                ? '📢'
                : n.title?.includes('🔥') ? '🔥' : n.title?.includes('👍') ? '👍' : n.title?.includes('💪') ? '💪' : n.title?.includes('👏') ? '👏' : n.title?.includes('❤️') ? '❤️' : '🔔'
              const unreadBg = isAnnouncement ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'
              const iconBg = isAnnouncement
                ? (n.read ? 'bg-blue-50' : 'bg-blue-100')
                : (n.read ? 'bg-gray-100' : 'bg-orange-100')

              return (
                <Link
                  key={n.id}
                  href={n.url || '/home'}
                  className={`block rounded-2xl p-4 ${n.read ? 'bg-gray-50' : unreadBg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                      <span className="text-lg">{emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {isAnnouncement && (
                        <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded mb-1">
                          運営からのお知らせ
                        </span>
                      )}
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1.5">
                        {new Date(n.created_at).toLocaleString('ja-JP', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          timeZone: 'Asia/Tokyo',
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${isAnnouncement ? 'bg-blue-500' : 'bg-orange-500'}`} />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm">お知らせはまだありません</p>
          </div>
        )}
      </main>
    </div>
  )
}
