'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['全て', '運動', '食習慣', '生活', '勉強', '趣味', 'その他']
const SCHEDULE_FILTERS = [
  { label: '全て', value: '' },
  { label: '募集中', value: 'fixed' },
  { label: 'いつでも', value: 'flexible' },
]

export default function CategoryTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') ?? '全て'
  const currentSchedule = searchParams.get('schedule') ?? ''

  const buildUrl = (category: string, schedule: string) => {
    const params = new URLSearchParams()
    if (category && category !== '全て') params.set('category', category)
    if (schedule) params.set('schedule', schedule)
    const qs = params.toString()
    return `/challenges${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-2">
      {/* カテゴリ */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((tab) => (
          <button
            key={tab}
            onClick={() => router.push(buildUrl(tab, currentSchedule))}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentCategory === tab
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* スケジュールフィルタ */}
      <div className="flex gap-2">
        {SCHEDULE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => router.push(buildUrl(currentCategory, f.value === currentSchedule ? '' : f.value))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              currentSchedule === f.value || (!currentSchedule && f.value === '')
                ? 'bg-orange-500 text-white'
                : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
            }`}
          >
            {f.label === '募集中' ? '📅 募集中（期間限定）' : f.label === 'いつでも' ? '🔄 いつでも参加OK' : f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
