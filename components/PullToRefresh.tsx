'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const THRESHOLD = 80

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0 && window.scrollY === 0) {
      // 引っ張り量を減衰させる（自然な感触）
      setPullDistance(Math.min(diff * 0.4, 120))
    }
  }, [pulling, refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return
    setPulling(false)

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(50)
      router.refresh()
      // 少し待ってからリセット（データ更新の体感）
      await new Promise(r => setTimeout(r, 800))
      setRefreshing(false)
      setPullDistance(0)
    } else {
      setPullDistance(0)
    }
  }, [pulling, pullDistance, refreshing, router])

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* プルインジケーター */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : '0px',
          transition: pulling ? 'none' : 'height 0.3s ease',
        }}
      >
        <div className={`flex items-center gap-2 text-gray-400 text-sm ${refreshing ? 'animate-pulse' : ''}`}>
          <span
            className="inline-block transition-transform"
            style={{
              transform: `rotate(${Math.min(pullDistance / THRESHOLD * 360, 360)}deg)`,
            }}
          >
            ↻
          </span>
          <span>
            {refreshing ? '更新中...' : pullDistance >= THRESHOLD ? '離して更新' : '引っ張って更新'}
          </span>
        </div>
      </div>
      {children}
    </div>
  )
}
