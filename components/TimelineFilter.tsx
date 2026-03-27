'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Challenge = {
  id: string
  title: string
  color: { bg: string; text: string; dot: string }
}

type Props = {
  challenges: Challenge[]
}

export default function TimelineFilter({ challenges }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeId = searchParams.get('challenge') ?? ''
  const scope = searchParams.get('scope') ?? ''

  const handleFilter = (id: string) => {
    if (id === activeId) {
      router.push('/home')
    } else {
      router.push(`/home?challenge=${id}`)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      <button
        onClick={() => router.push('/home')}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          !activeId && !scope
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        参加中
      </button>
      <button
        onClick={() => router.push('/home?scope=all')}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          scope === 'all'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        みんなの投稿
      </button>
      {!scope && challenges.length > 1 && challenges.map((c) => (
        <button
          key={c.id}
          onClick={() => handleFilter(c.id)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeId === c.id
              ? `${c.color.bg} ${c.color.text}`
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeId === c.id ? c.color.dot : 'bg-gray-400'}`} />
          {c.title}
        </button>
      ))}
    </div>
  )
}
