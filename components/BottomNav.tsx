'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20">
      <div className="max-w-lg mx-auto flex">
        <Link
          href="/challenges"
          className={`flex-1 py-3 text-center text-xs ${pathname === '/challenges' ? 'text-orange-500' : 'text-gray-400'}`}
        >
          <p className="text-lg">🏠</p>
          ホーム
        </Link>
        <Link
          href="/dashboard"
          className={`flex-1 py-3 text-center text-xs ${pathname === '/dashboard' ? 'text-orange-500' : 'text-gray-400'}`}
        >
          <p className="text-lg">👤</p>
          マイページ
        </Link>
      </div>
    </nav>
  )
}
