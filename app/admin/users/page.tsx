import { requireAdmin } from '@/lib/admin-guard'
import { UserActions } from '@/components/admin/UserActions'

type ProfileWithCount = {
  id: string
  nickname: string | null
  avatar_url: string | null
  role: string | null
  banned_at: string | null
  ban_reason: string | null
  created_at: string
  challenge_count: number
}

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin()

  // 直近50ユーザーを取得
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, role, banned_at, ban_reason, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-red-600">ユーザー情報の取得に失敗しました: {error.message}</p>
      </div>
    )
  }

  // 各ユーザーのチャレンジ参加数を取得
  const userIds = (profiles ?? []).map((p) => p.id)

  let countMap: Record<string, number> = {}
  if (userIds.length > 0) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .in('user_id', userIds)

    if (members) {
      for (const m of members) {
        countMap[m.user_id] = (countMap[m.user_id] || 0) + 1
      }
    }
  }

  const users: ProfileWithCount[] = (profiles ?? []).map((p) => ({
    ...p,
    challenge_count: countMap[p.id] || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ユーザー一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            直近50件のユーザーを表示しています
          </p>
        </div>

        {/* デスクトップ: テーブル表示 */}
        <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  参加数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  登録日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-medium text-orange-600">
                          {(user.nickname ?? '?')[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.nickname ?? '名前未設定'}
                        </p>
                        <p className="text-xs text-gray-400">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        管理者
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">一般</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.banned_at ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        BAN
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        有効
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {user.challenge_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <UserActions
                      userId={user.id}
                      nickname={user.nickname ?? '名前未設定'}
                      isBanned={!!user.banned_at}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              ユーザーがいません
            </div>
          )}
        </div>

        {/* モバイル: カード表示 */}
        <div className="space-y-3 md:hidden">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-medium text-orange-600">
                      {(user.nickname ?? '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.nickname ?? '名前未設定'}
                    </p>
                    <p className="text-xs text-gray-400">{user.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {user.role === 'admin' && (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      管理者
                    </span>
                  )}
                  {user.banned_at ? (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      BAN
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      有効
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>参加数: {user.challenge_count}</span>
                  <span>登録: {new Date(user.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                <UserActions
                  userId={user.id}
                  nickname={user.nickname ?? '名前未設定'}
                  isBanned={!!user.banned_at}
                />
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-400">
              ユーザーがいません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
