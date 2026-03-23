'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const tabs = [
  { href: '/home', label: 'タイムライン', icon: '📋', activeIcon: '📋' },
  { href: '/challenges', label: 'チャレンジ', icon: '✨', activeIcon: '✨' },
  { href: '/checkin', label: '記録', icon: '📷', activeIcon: '📷' },
  { href: '/history', label: '振り返り', icon: '🏦', activeIcon: '🏦' },
  { href: '/dashboard', label: 'マイページ', icon: '👤', activeIcon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [optimisticPath, setOptimisticPath] = useState(pathname)

  // パスが実際に変わったら同期
  useEffect(() => {
    setOptimisticPath(pathname)
  }, [pathname])

  const hiddenPaths = ['/privacy', '/terms', '/tokushoho', '/contact']
  const shouldHide =
    pathname.endsWith('/create') ||
    pathname.endsWith('/edit') ||
    hiddenPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))

  // 作成・編集ページ、および公開ページではナビバーを非表示
  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {tabs.map((tab) => {
          const isActive = optimisticPath === tab.href || optimisticPath.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setOptimisticPath(tab.href)}
              className={`relative flex flex-col items-center pt-2 pb-2.5 text-[10px] transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-orange-500" />
              )}
              <span className={`text-xl mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span className={isActive ? 'font-bold' : 'font-normal'}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
