import { getSessionUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import LogoutButton from '@/components/LogoutButton'

const ProfileSettings = dynamic(() => import('@/components/ProfileSettings'))

export default async function DashboardPage() {
  const { supabase, user } = await getSessionUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, avatar_url, bio, sns_links')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* プロフィール */}
        <div className="flex items-center gap-4 py-4">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="アイコン" width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(profile?.nickname ?? '?')[0]}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile?.nickname ?? 'ゲスト'}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* プロフィール・アカウント設定 */}
        <div className="mt-4">
          <ProfileSettings
            userId={user.id}
            initialNickname={profile?.nickname ?? ''}
            initialAvatarUrl={profile?.avatar_url ?? null}
            initialEmail={user.email ?? ''}
            initialBio={(profile?.bio as string) ?? ''}
            initialSnsLinks={(profile?.sns_links as Record<string, string>) ?? {}}
          />
        </div>

        {/* その他メニュー */}
        <div className="mt-4">
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            <Link href="/notifications" className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">お知らせ</span>
              <span className="text-gray-300">→</span>
            </Link>
            <Link href="/terms" className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">利用規約</span>
              <span className="text-gray-300">→</span>
            </Link>
            <Link href="/contact" className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-sm text-gray-700">お問い合わせ</span>
              <span className="text-gray-300">→</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
