'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['全て', '運動', '食習慣', '生活', '勉強', '趣味']

export default function CategoryTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? '全て'

  const handleClick = (tab: string) => {
    if (tab === '全て') {
      router.push('/challenges')
    } else {
      router.push(`/challenges?category=${encodeURIComponent(tab)}`)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((tab) => (
        <button
          key={tab}
          onClick={() => handleClick(tab)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            current === tab
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
