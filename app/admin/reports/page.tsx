import { requireAdmin } from '@/lib/admin-guard'
import ReportActions from '@/components/admin/ReportActions'

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  checkin_id: string | null
  reason: string
  detail: string | null
  status: ReportStatus
  admin_note: string | null
  created_at: string
  updated_at: string
  reporter: { nickname: string } | null
  reported_user: { nickname: string } | null
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '未対応',
  reviewed: '確認中',
  resolved: '解決済み',
  dismissed: '却下',
}

const STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-300',
}

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin()

  // 報告一覧を取得（プロフィール結合）
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(nickname),
      reported_user:profiles!reports_reported_user_id_fkey(nickname)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('報告一覧の取得に失敗:', error)
  }

  const reportList: Report[] = (reports ?? []) as Report[]

  // ステータス別カウント
  const statusCounts: Record<ReportStatus, number> = {
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
  }
  for (const report of reportList) {
    if (report.status in statusCounts) {
      statusCounts[report.status]++
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ページヘッダー */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          報告・通報管理
        </h1>

        {/* 報告サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="未対応"
            count={statusCounts.pending}
            colorClass="bg-yellow-50 border-yellow-300 text-yellow-800"
            accentClass="text-yellow-600"
          />
          <SummaryCard
            label="確認中"
            count={statusCounts.reviewed}
            colorClass="bg-blue-50 border-blue-300 text-blue-800"
            accentClass="text-blue-600"
          />
          <SummaryCard
            label="解決済み"
            count={statusCounts.resolved}
            colorClass="bg-green-50 border-green-300 text-green-800"
            accentClass="text-green-600"
          />
          <SummaryCard
            label="却下"
            count={statusCounts.dismissed}
            colorClass="bg-gray-50 border-gray-300 text-gray-600"
            accentClass="text-gray-500"
          />
        </div>

        {/* 報告一覧 */}
        {reportList.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">報告はありません</p>
          </div>
        ) : (
          <>
            {/* デスクトップ: テーブル表示 */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      報告者
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      対象ユーザー
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      理由
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      ステータス
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      報告日
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportList.map((report) => (
                    <tr
                      key={report.id}
                      className={
                        report.status === 'pending'
                          ? 'bg-yellow-50/50'
                          : 'bg-white'
                      }
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {report.reporter?.nickname ?? '不明'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {report.reported_user?.nickname ?? '不明'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {report.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[report.status]}`}
                        >
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <ReportActions
                          reportId={report.id}
                          currentStatus={report.status}
                          currentNote={report.admin_note ?? ''}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル: カード表示 */}
            <div className="md:hidden space-y-4">
              {reportList.map((report) => (
                <div
                  key={report.id}
                  className={`rounded-lg border p-4 ${
                    report.status === 'pending'
                      ? 'bg-yellow-50/50 border-yellow-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[report.status]}`}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm">
                      <span className="text-gray-500">報告者: </span>
                      <span className="font-medium text-gray-900">
                        {report.reporter?.nickname ?? '不明'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">対象: </span>
                      <span className="font-medium text-gray-900">
                        {report.reported_user?.nickname ?? '不明'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">理由: </span>
                      <span className="text-gray-700">{report.reason}</span>
                    </p>
                  </div>
                  <ReportActions
                    reportId={report.id}
                    currentStatus={report.status}
                    currentNote={report.admin_note ?? ''}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  count,
  colorClass,
  accentClass,
}: {
  label: string
  count: number
  colorClass: string
  accentClass: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accentClass}`}>{count}</p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
