'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORY_ICONS = [
  { label: '運動', emoji: '🏃', color: 'bg-pink-50', activeColor: 'bg-pink-200' },
  { label: 'ルーティン', emoji: '📅', color: 'bg-blue-50', activeColor: 'bg-blue-200', filter: '生活' },
  { label: '食習慣', emoji: '🥗', color: 'bg-green-50', activeColor: 'bg-green-200' },
  { label: '読書', emoji: '📚', color: 'bg-yellow-50', activeColor: 'bg-yellow-200', filter: '趣味' },
  { label: '早起き', emoji: '☀️', color: 'bg-orange-50', activeColor: 'bg-orange-200', filter: '生活' },
  { label: '勉強', emoji: '✏️', color: 'bg-purple-50', activeColor: 'bg-purple-200' },
]

export default function CategoryIcons() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? '全て'

  const handleClick = (cat: typeof CATEGORY_ICONS[0]) => {
    const filterName = cat.filter ?? cat.label
    if (current === filterName) {
      router.push('/challenges')
    } else {
      router.push(`/challenges?category=${encodeURIComponent(filterName)}`)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
      {CATEGORY_ICONS.map((cat) => {
        const filterName = cat.filter ?? cat.label
        const isActive = current === filterName
        return (
          <button
            key={cat.label}
            onClick={() => handleClick(cat)}
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
  )
}
