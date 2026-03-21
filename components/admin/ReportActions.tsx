'use client'

import { useState } from 'react'

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: '未対応' },
  { value: 'reviewed', label: '確認中' },
  { value: 'resolved', label: '解決済み' },
  { value: 'dismissed', label: '却下' },
]

interface ReportActionsProps {
  reportId: string
  currentStatus: ReportStatus
  currentNote: string
}

export default function ReportActions({
  reportId,
  currentStatus,
  currentNote,
}: ReportActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<ReportStatus>(currentStatus)
  const [adminNote, setAdminNote] = useState(currentNote)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/reports/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status,
          adminNote,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '更新に失敗しました')
      }

      setMessage({ type: 'success', text: '更新しました' })
      setTimeout(() => {
        setMessage(null)
        setIsOpen(false)
        window.location.reload()
      }, 1000)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '更新に失敗しました',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
      >
        対応する
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* ステータス変更 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          ステータス
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 管理者メモ */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          管理者メモ
        </label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={2}
          placeholder="対応内容をメモ..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* メッセージ */}
      {message && (
        <p
          className={`text-xs ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={() => {
            setIsOpen(false)
            setStatus(currentStatus)
            setAdminNote(currentNote)
            setMessage(null)
          }}
          className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
