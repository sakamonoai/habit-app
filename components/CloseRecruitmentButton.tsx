'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  challengeId: string
  isClosed: boolean
}

export default function CloseRecruitmentButton({ challengeId, isClosed }: Props) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    await supabase
      .from('challenges')
      .update({ recruitment_closed: !isClosed })
      .eq('id', challengeId)
    setLoading(false)
    setShowConfirm(false)
    router.refresh()
  }

  if (isClosed) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="w-full py-3 bg-blue-50 text-blue-600 font-medium text-sm rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        {loading ? '処理中...' : '🔓 募集を再開する'}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-3 bg-red-50 text-red-500 font-medium text-sm rounded-xl hover:bg-red-100 transition-colors"
      >
        🔒 新規参加を締め切る
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="text-lg font-bold text-gray-900">募集を締め切りますか？</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              新しい参加者が入れなくなります。後から再開することもできます。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleToggle}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loading ? '処理中...' : '締め切る'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
