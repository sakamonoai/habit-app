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
  creator_nickname: string | null
  creator_avatar_url: string | null
  memberCount: number
  avgRating: number | null
  reviewCount: number
  thumbnail_url: string | null
  schedule_type: string
  is_official: boolean
  reward_title: string | null
  gradient: string
}

const DEFAULT_THUMBNAILS: Record<string, string> = {
  '運動': '/defaults/exercise.jpg',
  '食習慣': '/defaults/food.jpg',
  '生活': '/defaults/lifestyle.jpg',
  '朝活': '/defaults/lifestyle.jpg',
  '勉強': '/defaults/study.jpg',
  '学習': '/defaults/study.jpg',
  '趣味': '/defaults/hobby.jpg',
  '読書': '/defaults/hobby.jpg',
}
const DEFAULT_THUMBNAIL_FALLBACK = '/defaults/other.jpg'

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

const CATEGORY_MAP: Record<string, string[]> = {
  '運動': ['運動'],
  '食習慣': ['食習慣'],
  '生活': ['生活', '朝活'],
  '勉強': ['勉強', '学習'],
  '趣味': ['趣味', '読書'],
}

const SCHEDULE_FILTERS = [
  { label: '全て', value: '' },
  { label: '📅 開催前', value: 'upcoming' },
  { label: '🔥 開催中', value: 'ongoing' },
  { label: '🔄 いつでも参加OK', value: 'flexible' },
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

  const today = new Date().toISOString().split('T')[0]
  if (schedule === 'upcoming') {
    filtered = filtered
      .filter(c => c.schedule_type === 'fixed' && c.start_date && c.start_date > today)
      .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
  } else if (schedule === 'ongoing') {
    filtered = filtered
      .filter(c => c.schedule_type === 'fixed' && c.start_date && c.start_date <= today)
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

  return (
    <>
      {/* カテゴリアイコン */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {/* 全てボタン */}
          <button
            onClick={() => { setIconFilter(null); setCategory('全て') }}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className={`w-14 h-14 ${!iconFilter ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-gray-50'} rounded-2xl flex items-center justify-center text-2xl transition-colors`}>
              🔥
            </div>
            <span className={`text-xs ${!iconFilter ? 'text-orange-500 font-bold' : 'text-gray-600'}`}>全て</span>
          </button>
          {CATEGORY_ICONS.map((cat) => {
            const filterName = cat.filters[0] === '生活' ? '生活' : cat.filters[0] === '趣味' || cat.filters[0] === '読書' ? '趣味' : cat.filters[0]
            const isActive = iconFilter === filterName
            return (
              <button
                key={cat.label}
                onClick={() => handleIconClick(cat)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className={`w-14 h-14 ${isActive ? cat.activeColor + ' ring-2 ring-gray-300' : cat.color} rounded-2xl flex items-center justify-center text-2xl transition-colors`}>
                  {cat.emoji}
                </div>
                <span className={`text-xs ${isActive ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-gray-900">
          {schedule === 'upcoming' ? '📅 開催前の' : schedule === 'ongoing' ? '🔥 開催中の' : schedule === 'flexible' ? '🔄 いつでも参加の' : ''}
          {activeCategory !== '全て' ? activeCategory : schedule ? '' : '人気'}チャレンジ
        </h2>
        <span className="text-sm text-gray-400">全{filtered.length}件</span>
      </div>

      {/* スケジュールフィルター */}
      <div className="px-4 pb-3 max-w-lg mx-auto">
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
              {f.label}
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
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <Image
                  src={challenge.thumbnail_url || DEFAULT_THUMBNAILS[challenge.category ?? ''] || DEFAULT_THUMBNAIL_FALLBACK}
                  alt={challenge.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 50vw, 256px"
                  quality={90}
                  loading="lazy"
                />
                {/* 左上バッジ: 公式 / キャンペーン */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {challenge.is_official && (
                    <div className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                      <span className="text-[8px]">✓</span> 公式
                    </div>
                  )}
                  {challenge.reward_title && (
                    <div className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                      🎁 キャンペーン
                    </div>
                  )}
                </div>
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
                <div className="flex items-center gap-1.5">
                  {challenge.is_official ? (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-black">✓</span>
                      </div>
                      <p className="text-xs font-bold text-orange-500">公式</p>
                    </div>
                  ) : challenge.creator_nickname ? (
                    <>
                      {challenge.creator_avatar_url ? (
                        <Image src={challenge.creator_avatar_url} alt="" width={16} height={16} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                          {challenge.creator_nickname[0]}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 truncate">{challenge.creator_nickname}</p>
                    </>
                  ) : null}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-1">{challenge.title}</h3>
                {challenge.reward_title && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs">🎁</span>
                    <span className="text-xs font-semibold text-amber-600">特典あり</span>
                  </div>
                )}
                {challenge.avgRating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs font-semibold text-gray-700">{challenge.avgRating}</span>
                    <span className="text-xs text-gray-400">({challenge.reviewCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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
