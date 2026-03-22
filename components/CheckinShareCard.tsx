'use client'

import { useState } from 'react'

type Props = {
  checkinCount: number
  durationDays: number
  challengeTitle: string
  isMilestone?: boolean
}

const MILESTONES = [3, 5, 7, 10, 14, 21]

function getMilestoneInfo(count: number) {
  if (count >= 21) return { emoji: '👑', label: '21日完走！習慣化達成', tier: 'gold' }
  if (count >= 14) return { emoji: '💎', label: '14日突破！もう止まれない', tier: 'purple' }
  if (count >= 10) return { emoji: '⭐', label: '10日突破！二桁到達', tier: 'blue' }
  if (count >= 7) return { emoji: '🔥', label: '7日突破！1週間達成', tier: 'orange' }
  if (count >= 5) return { emoji: '💪', label: '5日突破！折り返し地点', tier: 'green' }
  if (count >= 3) return { emoji: '✨', label: '3日突破！三日坊主卒業', tier: 'teal' }
  return null
}

const tierGradients: Record<string, string> = {
  gold: 'from-yellow-400 via-amber-500 to-orange-500',
  purple: 'from-purple-400 via-violet-500 to-indigo-500',
  blue: 'from-blue-400 via-cyan-500 to-teal-400',
  orange: 'from-orange-400 via-red-400 to-rose-500',
  green: 'from-green-400 via-emerald-500 to-teal-500',
  teal: 'from-teal-400 via-cyan-400 to-blue-400',
}

const tierBorders: Record<string, string> = {
  gold: 'border-amber-300',
  purple: 'border-violet-300',
  blue: 'border-cyan-300',
  orange: 'border-orange-300',
  green: 'border-emerald-300',
  teal: 'border-teal-300',
}

function generateShareText(checkinCount: number, challengeTitle: string, durationDays: number) {
  const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)
  const milestone = getMilestoneInfo(checkinCount)
  const fires = '🔥'.repeat(Math.min(Math.floor(checkinCount / 3) + 1, 7))

  if (milestone && checkinCount >= 21) {
    return `${fires}\n\n「${challengeTitle}」を21日間完走しました！\n達成率 ${rate}%\n\n習慣化は仕組みで解決する。\n\n#ハビチャレ #習慣化 #${checkinCount}日連続`
  }
  if (milestone) {
    return `${fires}\n\n「${challengeTitle}」${checkinCount}日連続達成！\n達成率 ${rate}%\n\n${milestone.label}\n\n#ハビチャレ #習慣化 #${checkinCount}日連続`
  }
  return `${fires}\n\n「${challengeTitle}」${checkinCount}日目クリア！\n達成率 ${rate}%\n\n#ハビチャレ #習慣化`
}

export default function CheckinShareCard({ checkinCount, durationDays, challengeTitle, isMilestone }: Props) {
  const [shared, setShared] = useState(false)
  const rate = Math.min(Math.round((checkinCount / durationDays) * 100), 100)
  const milestone = getMilestoneInfo(checkinCount)
  const isMilestoneDay = isMilestone || MILESTONES.includes(checkinCount)
  const tier = milestone?.tier ?? 'orange'

  const handleShare = () => {
    const text = generateShareText(checkinCount, challengeTitle, durationDays)
    const url = 'https://habit-app-sand.vercel.app/lp'
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
    setShared(true)
  }

  // マイルストーン達成時のフルカード
  if (isMilestoneDay && milestone) {
    return (
      <div className="mb-6">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tierGradients[tier]} p-5 text-white text-center`}>
          {/* 背景パーティクル */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${(i * 23 + 10) % 100}%`,
                  top: `${(i * 17 + 5) % 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="text-5xl mb-2">{milestone.emoji}</div>
            <p className="text-white/80 text-xs font-medium mb-1">{challengeTitle}</p>
            <p className="text-4xl font-black mb-1">{checkinCount}日連続</p>
            <p className="text-white/90 font-bold text-sm mb-3">{milestone.label}</p>

            {/* 達成率バー */}
            <div className="bg-white/20 rounded-full h-2.5 mx-auto max-w-[200px] mb-1">
              <div
                className="h-2.5 rounded-full bg-white/80 transition-all"
                style={{ width: `${Math.max(rate, 3)}%` }}
              />
            </div>
            <p className="text-white/70 text-xs mb-4">達成率 {rate}%（{checkinCount}/{durationDays}日）</p>

            <button
              onClick={handleShare}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                shared
                  ? 'bg-white/30 text-white'
                  : 'bg-white text-gray-900 hover:bg-white/90 shadow-lg'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {shared ? 'シェアしました！' : 'Xでシェアする'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 通常のチェックイン完了カード
  return (
    <div className={`rounded-2xl p-5 mb-6 text-center border ${tierBorders[tier]} bg-gradient-to-r from-green-50 to-emerald-50`}>
      <div className="text-4xl mb-2">🎉</div>
      <p className="text-green-800 font-bold text-lg">今日もやりきった！</p>
      <p className="text-green-700 font-black text-3xl my-2">
        {'🔥'.repeat(Math.min(Math.floor(checkinCount / 3) + 1, 5))} {checkinCount}日目
      </p>
      <div className="bg-green-100 rounded-full h-2 mx-auto max-w-[200px] mb-1">
        <div
          className="h-2 rounded-full bg-green-500 transition-all"
          style={{ width: `${Math.max(rate, 3)}%` }}
        />
      </div>
      <p className="text-green-600 text-xs mb-4">達成率 {rate}%（{checkinCount}/{durationDays}日）</p>

      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
          shared
            ? 'bg-gray-100 text-gray-500'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {shared ? 'シェアしました！' : 'Xでシェアする'}
      </button>
    </div>
  )
}
