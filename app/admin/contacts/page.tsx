import { requireAdmin } from '@/lib/admin-guard'

export default async function AdminContactsPage() {
  const { supabase } = await requireAdmin()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">お問い合わせ</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">日時</th>
                <th className="px-4 py-3 font-semibold">送信者</th>
                <th className="px-4 py-3 font-semibold">返信先</th>
                <th className="px-4 py-3 font-semibold">カテゴリ</th>
                <th className="px-4 py-3 font-semibold">内容</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!contacts || contacts.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    お問い合わせはありません
                  </td>
                </tr>
              )}
              {contacts?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(c.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <p className="font-medium text-gray-900">{c.nickname ?? '名前未設定'}</p>
                    <p className="text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {c.reply_email ? (
                      <a href={`mailto:${c.reply_email}`} className="text-orange-500 hover:underline">{c.reply_email}</a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-md">
                    <p className="whitespace-pre-wrap">{c.message}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
