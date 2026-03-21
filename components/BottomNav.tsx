'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/home', label: 'タイムライン', icon: '📋', activeIcon: '📋' },
  { href: '/challenges', label: 'チャレンジ', icon: '✨', activeIcon: '✨' },
  { href: '/checkin', label: '認証', icon: '📷', activeIcon: '📷' },
  { href: '/dashboard', label: 'マイページ', icon: '👤', activeIcon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center py-3 text-[10px] transition-colors ${
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
