import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const { supabase } = await requireAdmin()

  const [{ data: profile }, { data: memberships }, { data: badges }, { data: checkins }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url, bio, sns_links, role, banned_at, ban_reason, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('group_members')
      .select(`
        id,
        user_id,
        status,
        joined_at,
        deposit_amount,
        group_id,
        challenge_id,
        challenges(id, title, duration_days, start_date, end_date, status, created_at)
      `)
      .eq('user_id', id)
      .order('joined_at', { ascending: false }),
    supabase
      .from('badges')
      .select('id, badge_type, earned_at, challenges(title)')
      .eq('user_id', id)
      .order('earned_at', { ascending: false }),
    supabase
      .from('checkins')
      .select('id, checked_in_at, comment, photo_url')
      .eq('user_id', id)
      .order('checked_in_at', { ascending: false })
      .limit(20),
  ])

  if (!profile) notFound()

  let email: string | null = null
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (authData?.users) {
    const authUser = authData.users.find((u) => u.id === id)
    email = authUser?.email ?? null
  }

  const activeMemberships = (memberships ?? []).filter((m) => m.status === 'active')
  const completedMemberships = (memberships ?? []).filter((m) => m.status === 'completed')
  const forfeitedMemberships = (memberships ?? []).filter((m) => m.status === 'forfeited')
  const totalDeposit = (memberships ?? []).reduce((sum: number, m: any) => sum + (m.deposit_amount ?? 0), 0)

  const snsLinks = (profile.sns_links ?? {}) as Record<string, string>
  const visibleSnsLinks = Object.entries(snsLinks).filter(([, value]) => value && String(value).trim())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
              ← ユーザー一覧に戻る
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">ユーザー詳細</h1>
            <p className="mt-1 text-sm text-gray-500">今後も項目を追加しやすい管理用プロフィール画面です</p>
          </div>
          <div className="flex gap-2 text-xs">
            {profile.role === 'admin' && (
              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-800">
                管理者
              </span>
            )}
            {profile.banned_at ? (
              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-800">
                BAN中
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800">
                有効
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600">
                    {(profile.nickname ?? '?')[0]}
                  </div>
                )}
                <h2 className="mt-4 text-xl font-bold text-gray-900">{profile.nickname ?? '名前未設定'}</h2>
                <p className="mt-1 text-sm text-gray-500">{email ?? 'メール未設定'}</p>
                <p className="mt-2 text-xs text-gray-400">ID: {profile.id}</p>
              </div>

              {profile.bio && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900">自己紹介</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{profile.bio}</p>
                </div>
              )}

              <div className="mt-5 border-t border-gray-100 pt-5 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">登録日</span>
                  <span>{new Date(profile.created_at).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">ロール</span>
                  <span>{profile.role === 'admin' ? '管理者' : '一般'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">参加件数</span>
                  <span>{memberships?.length ?? 0}件</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">チェックイン数</span>
                  <span>{checkins?.length ?? 0}件（直近20件取得）</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">累計デポジット</span>
                  <span>¥{totalDeposit.toLocaleString()}</span>
                </div>
              </div>

              {profile.ban_reason && (
                <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">BAN理由</p>
                  <p className="mt-1 whitespace-pre-wrap">{profile.ban_reason}</p>
                </div>
              )}

              {visibleSnsLinks.length > 0 && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900">SNSリンク</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleSnsLinks.map(([key, value]) => (
                      <span key={key} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">サマリー</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="text-xs text-green-600">参加中</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{activeMemberships.length}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">達成済み</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">{completedMemberships.length}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs text-red-600">没収</p>
                  <p className="mt-1 text-2xl font-bold text-red-700">{forfeitedMemberships.length}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">参加チャレンジ一覧</h3>
                  <p className="mt-1 text-sm text-gray-500">参加履歴も含めて確認できます</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {memberships?.length ?? 0}件
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {!memberships || memberships.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                    まだ参加チャレンジがありません
                  </div>
                ) : (
                  memberships.map((membership: any) => {
                    const challenge = Array.isArray(membership.challenges)
                      ? membership.challenges[0]
                      : membership.challenges

                    return (
                      <div key={membership.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900">
                                {challenge?.title ?? '不明なチャレンジ'}
                              </p>
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                membership.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : membership.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {membership.status === 'active'
                                  ? '参加中'
                                  : membership.status === 'completed'
                                    ? '達成済み'
                                    : '没収'}
                              </span>
                              {challenge?.status === 'suspended' && (
                                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                  チャレンジ停止中
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span>参加日: {membership.joined_at ? new Date(membership.joined_at).toLocaleDateString('ja-JP') : '-'}</span>
                              <span>期間: {challenge?.duration_days ?? '-'}日</span>
                              <span>デポジット: ¥{Number(membership.deposit_amount ?? 0).toLocaleString()}</span>
                              <span>開始: {challenge?.start_date ?? '-'}</span>
                              <span>終了: {challenge?.end_date ?? '-'}</span>
                            </div>
                          </div>
                          {challenge?.id && (
                            <Link
                              href={`/admin/challenges/${challenge.id}`}
                              className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              チャレンジ詳細
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">最近のアクティビティ</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">獲得バッジ</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    {!badges || badges.length === 0 ? (
                      <p className="text-gray-400">まだバッジはありません</p>
                    ) : (
                      badges.slice(0, 8).map((badge: any) => (
                        <div key={badge.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                          <span className="truncate">🏆 {(badge.challenges as any)?.title ?? 'チャレンジ'}</span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {badge.earned_at ? new Date(badge.earned_at).toLocaleDateString('ja-JP') : '-'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">最近のチェックイン</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    {!checkins || checkins.length === 0 ? (
                      <p className="text-gray-400">まだチェックインはありません</p>
                    ) : (
                      checkins.map((checkin: any) => (
                        <div key={checkin.id} className="rounded-lg bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-400">
                              {checkin.checked_in_at
                                ? new Date(checkin.checked_in_at).toLocaleString('ja-JP')
                                : '-'}
                            </span>
                            {checkin.photo_url && <span className="text-xs text-orange-500">画像あり</span>}
                          </div>
                          {checkin.comment && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-700">{checkin.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
