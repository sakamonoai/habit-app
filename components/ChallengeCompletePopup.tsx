'use client'

import { useState, useEffect } from 'react'

type CompletedChallenge = {
  title: string
  isPerfect: boolean
  rate: number
}

export default function ChallengeCompletePopup({
  challenges,
}: {
  challenges: CompletedChallenge[]
}) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (challenges.length === 0) return
    // 同じチャレンジで何度も表示しないようlocalStorageで管理
    const key = `challenge_complete_shown_${challenges.map(c => c.title).join(',')}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, new Date().toISOString())
    setVisible(true)
  }, [challenges])

  if (!visible || challenges.length === 0) return null

  const ch = challenges[current]

  const handleNext = () => {
    if (current < challenges.length - 1) {
      setCurrent(current + 1)
    } else {
      setVisible(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl mx-6 max-w-sm w-full p-6 text-center shadow-xl">
        <div className="text-5xl mb-4">
          {ch.isPerfect ? '🏆' : '🎉'}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {ch.isPerfect ? 'パーフェクト達成！' : 'チャレンジ達成！'}
        </h2>
        <p className="text-sm text-gray-600 mb-1">{ch.title}</p>
        <p className="text-3xl font-bold text-green-600 mb-4">
          達成率 {ch.rate}%
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {ch.isPerfect
            ? 'すべての日をクリアしました！素晴らしい！'
            : 'おめでとうございます！チャレンジ期間が終了しました！'}
        </p>
        <button
          onClick={handleNext}
          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
        >
          {current < challenges.length - 1 ? '次へ' : '閉じる'}
        </button>
      </div>
    </div>
  )
}
