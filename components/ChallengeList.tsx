'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Challenge = {
  id: string
  title: string
  duration_days: number
  category: string | null
  start_date: string | null
  created_by: string | null
  memberCount: number
  avgRating: number | null
  reviewCount: number
  thumbnail_url: string | null
  schedule_type: string
  is_official: boolean
  gradient: string
}

const CARD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-blue-400 to-indigo-400',
  'from-green-400 to-teal-400',
  'from-purple-400 to-pink-400',
  'from-yellow-400 to-orange-400',
]

const CATEGORY_ICONS = [
  { label: '運動', emoji: '🏃', color: 'bg-pink-50', activeColor: 'bg-pink-200', filters: ['運動'] },
  { label: 'ルーティン', emoji: '📅', color: 'bg-blue-50', activeColor: 'bg-blue-200', filters: ['生活', '朝活'] },
  { label: '食習慣', emoji: '🥗', color: 'bg-green-50', activeColor: 'bg-green-200', filters: ['食習慣'] },
  { label: '読書', emoji: '📚', color: 'bg-yellow-50', activeColor: 'bg-yellow-200', filters: ['趣味', '読書'] },
  { label: '早起き', emoji: '☀️', color: 'bg-orange-50', activeColor: 'bg-orange-200', filters: ['生活', '朝活'] },
  { label: '勉強', emoji: '✏️', color: 'bg-purple-50', activeColor: 'bg-purple-200', filters: ['勉強', '学習'] },
]

const CATEGORIES = ['全て', '運動', '食習慣', '生活', '勉強', '趣味', 'その他']
const CATEGORY_MAP: Record<string, string[]> = {
  '運動': ['運動'],
  '食習慣': ['食習慣'],
  '生活': ['生活', '朝活'],
  '勉強': ['勉強', '学習'],
  '趣味': ['趣味', '読書'],
}

const SCHEDULE_FILTERS = [
  { label: '全て', value: '' },
  { label: '募集中', value: 'fixed' },
  { label: 'いつでも', value: 'flexible' },
]

function durationLabel(days: number) {
  if (days <= 7) return `${days}日間`
  if (days <= 14) return '2週間'
  if (days <= 31) return `${Math.round(days / 7)}週間`
  return `${Math.round(days / 30)}ヶ月`
}

type Props = {
  challenges: Challenge[]
}

export default function ChallengeList({ challenges }: Props) {
  const [category, setCategory] = useState('全て')
  const [schedule, setSchedule] = useState('')
  const [iconFilter, setIconFilter] = useState<string | null>(null)

  // クライアント側フィルタリング（即座に反映）
  let filtered = challenges

  // アイコンフィルタ or カテゴリタブフィルタ
  const activeCategory = iconFilter ?? category
  if (activeCategory !== '全て') {
    const cats = CATEGORY_MAP[activeCategory]
    if (cats) {
      filtered = filtered.filter(c => c.category && cats.includes(c.category))
    } else if (activeCategory === 'その他') {
      const allMapped = Object.values(CATEGORY_MAP).flat()
      filtered = filtered.filter(c => !c.category || !allMapped.includes(c.category))
    }
  }

  if (schedule === 'fixed') {
    filtered = filtered
      .filter(c => c.schedule_type === 'fixed')
      .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
  } else if (schedule === 'flexible') {
    filtered = filtered.filter(c => c.schedule_type === 'flexible')
  }

  const handleIconClick = (cat: typeof CATEGORY_ICONS[0]) => {
    const filterName = cat.filters[0] === '生活' ? '生活' : cat.filters[0] === '趣味' || cat.filters[0] === '読書' ? '趣味' : cat.filters[0]
    if (iconFilter === filterName) {
      setIconFilter(null)
      setCategory('全て')
    } else {
      setIconFilter(filterName)
      setCategory(filterName)
    }
  }

  const handleCategoryClick = (tab: string) => {
    setCategory(tab)
    setIconFilter(null)
  }

  return (
    <>
      {/* カテゴリアイコン */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {CATEGORY_ICONS.map((cat) => {
            const filterName = cat.filters[0] === '生活' ? '生活' : cat.filters[0] === '趣味' || cat.filters[0] === '読書' ? '趣味' : cat.filters[0]
            const isActive = iconFilter === filterName
            return (
              <button
                key={cat.label}
                onClick={() => handleIconClick(cat)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className={`w-14 h-14 ${isActive ? cat.activeColor : cat.color} rounded-2xl flex items-center justify-center text-2xl transition-colors`}>
                  {cat.emoji}
                </div>
                <span className={`text-xs ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-gray-900">
          {schedule === 'fixed' ? '📅 募集中の' : schedule === 'flexible' ? '🔄 いつでも参加の' : ''}
          {activeCategory !== '全て' ? activeCategory : schedule ? '' : '人気'}チャレンジ
        </h2>
        <span className="text-sm text-gray-400">全{filtered.length}件</span>
      </div>

      {/* カテゴリタブ + スケジュール */}
      <div className="px-4 pb-3 max-w-lg mx-auto space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => handleCategoryClick(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {SCHEDULE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSchedule(schedule === f.value ? '' : f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                schedule === f.value || (!schedule && f.value === '')
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-500'
              }`}
            >
              {f.label === '募集中' ? '📅 募集中（期間限定）' : f.label === 'いつでも' ? '🔄 いつでも参加OK' : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* カードグリッド */}
      {filtered.length > 0 ? (
        <div className="px-4 grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {filtered.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              className="block group"
            >
              <div className={`relative aspect-[4/5] ${challenge.thumbnail_url ? 'bg-gray-100' : `bg-gradient-to-br ${challenge.gradient}`} rounded-2xl overflow-hidden`}>
                {challenge.thumbnail_url ? (
                  <Image src={challenge.thumbnail_url} alt={challenge.title} fill className="object-cover" sizes="(max-width: 512px) 50vw, 256px" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-30">
                      {challenge.title.includes('朝活') ? '☀️' :
                       challenge.title.includes('筋トレ') || challenge.title.includes('運動') ? '💪' :
                       challenge.title.includes('勉強') || challenge.title.includes('読書') ? '📚' : '🔥'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <span>👤</span> {challenge.memberCount}人
                </div>
                {challenge.schedule_type === 'fixed' && challenge.start_date && (() => {
                  const daysUntil = Math.ceil((new Date(challenge.start_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  if (daysUntil > 7) return null
                  return (
                    <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-lg font-bold ${daysUntil <= 1 ? 'bg-red-500' : daysUntil <= 3 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                      {daysUntil <= 0 ? '開催中' : daysUntil === 1 ? '明日開始！' : `あと${daysUntil}日`}
                    </div>
                  )
                })()}
              </div>
              <div className="pt-2 pb-1">
                {challenge.is_official && (
                  <p className="text-xs font-semibold text-orange-500">公式チャレンジ</p>
                )}
                <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-1">{challenge.title}</h3>
                {challenge.avgRating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs font-semibold text-gray-700">{challenge.avgRating}</span>
                    <span className="text-xs text-gray-400">({challenge.reviewCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">毎日</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{durationLabel(challenge.duration_days)}</span>
                  {challenge.schedule_type === 'fixed' && challenge.start_date && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
                      {new Date(challenge.start_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}〜
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 max-w-lg mx-auto">
          <p className="text-4xl mb-3">🏃</p>
          <p className="text-sm">現在参加できるチャレンジはありません</p>
        </div>
      )}
    </>
  )
}
