'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'ダッシュボード', icon: '📊' },
  { href: '/admin/users', label: 'ユーザー管理', icon: '👥' },
  { href: '/admin/challenges', label: 'チャレンジ管理', icon: '🎯' },
  { href: '/admin/payments', label: '決済・売上', icon: '💰' },
  { href: '/admin/reports', label: '不正報告', icon: '🚨' },
  { href: '/admin/contacts', label: 'お問い合わせ', icon: '✉️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー（PC） */}
      <aside className="hidden md:flex md:w-60 bg-gray-900 text-white flex-col fixed inset-y-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold">ハビチャレ管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 font-semibold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700">
          <Link href="/challenges" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← アプリに戻る
          </Link>
        </div>
      </aside>

      {/* モバイルヘッダー */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-gray-900 text-white z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold">ハビチャレ管理</h1>
          <Link href="/challenges" className="text-xs text-gray-400">← アプリ</Link>
        </div>
        <nav className="flex overflow-x-auto scrollbar-hide border-t border-gray-700">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-4 py-2.5 text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-orange-400 border-b-2 border-orange-400 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 md:ml-60 pt-24 md:pt-0">
        {children}
      </main>
    </div>
  )
}
