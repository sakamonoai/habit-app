'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const tabs = [
  { href: '/home', label: 'タイムライン', icon: '📋', activeIcon: '📋' },
  { href: '/challenges', label: 'チャレンジ', icon: '✨', activeIcon: '✨' },
  { href: '/checkin', label: '記録', icon: '📷', activeIcon: '📷' },
  { href: '/dashboard', label: 'マイページ', icon: '👤', activeIcon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [optimisticPath, setOptimisticPath] = useState(pathname)

  // パスが実際に変わったら同期
  useEffect(() => {
    setOptimisticPath(pathname)
  }, [pathname])

  // 作成・編集ページではナビバーを非表示
  if (pathname.endsWith('/create') || pathname.endsWith('/edit')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {tabs.map((tab) => {
          const isActive = optimisticPath === tab.href || optimisticPath.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setOptimisticPath(tab.href)}
              className={`flex flex-col items-center py-3 text-[10px] ${
                isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              <span className="text-xl mb-0.5">{isActive ? tab.activeIcon : tab.icon}</span>
              <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
