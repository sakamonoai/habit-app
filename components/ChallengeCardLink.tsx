'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  href: string
  checkedInToday: boolean
  checkinDeadline: string | null
  children: ReactNode
}

export default function ChallengeCardLink({ href, checkedInToday, checkinDeadline, children }: Props) {
  const router = useRouter()
  const [showPopup, setShowPopup] = useState(false)
  const [isPassedDeadline, setIsPassedDeadline] = useState(false)

  useEffect(() => {
    if (!checkinDeadline || checkedInToday) return
    const now = new Date()
    const [h, m] = checkinDeadline.split(':').map(Number)
    const todayDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    setIsPassedDeadline(now > todayDeadline)
  }, [checkinDeadline, checkedInToday])

  const handleClick = (e: React.MouseEvent) => {
    if (isPassedDeadline && !checkedInToday) {
      e.preventDefault()
      setShowPopup(true)
    }
  }

  const handleDismiss = () => {
    setShowPopup(false)
    router.push(href)
  }

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className="block bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
      >
        {children}
      </a>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleDismiss}>
          <div className="bg-white rounded-2xl shadow-xl mx-6 p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-3">😢</p>
            <p className="text-lg font-bold text-gray-900">締め切りをすぎてしまいました</p>
            <p className="text-sm text-gray-500 mt-2">明日こそは頑張りましょう！</p>
            <button
              onClick={handleDismiss}
              className="mt-5 w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
            >
              それでも記録する
            </button>
          </div>
        </div>
      )}
    </>
  )
}
