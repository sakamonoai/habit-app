'use client'

import { useState, useEffect } from 'react'

/** 締切3時間以内になったら警告を表示する */
export default function DeadlineWarning({ deadline }: { deadline: string }) {
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const [h, m] = deadline.split(':').map(Number)
      const todayDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
      const diffMs = todayDeadline.getTime() - now.getTime()

      // 締切を過ぎている or 3時間以上ある場合は非表示
      if (diffMs <= 0 || diffMs > 3 * 60 * 60 * 1000) {
        setRemainingLabel(null)
        return
      }

      const totalMin = Math.ceil(diffMs / 60000)
      const hours = Math.floor(totalMin / 60)
      const mins = totalMin % 60
      if (hours > 0) {
        setRemainingLabel(`${hours}時間${mins > 0 ? `${mins}分` : ''}`)
      } else {
        setRemainingLabel(`${mins}分`)
      }
    }

    calc()
    const timer = setInterval(calc, 60000) // 1分ごとに更新
    return () => clearInterval(timer)
  }, [deadline])

  if (!remainingLabel) return null

  return (
    <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
      <p className="text-xs text-amber-700 font-semibold">
        ⏰ 締切まであと{remainingLabel}！
      </p>
    </div>
  )
}
