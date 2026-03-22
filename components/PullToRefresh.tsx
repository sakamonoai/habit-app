'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function PullToRefresh({ children }: Props) {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [released, setReleased] = useState(false)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const THRESHOLD = 60
  const MAX_PULL = 140

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return
    // ページ最上部にいるときだけ有効
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
      setReleased(false)
    }
  }, [refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || refreshing) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0 && window.scrollY <= 0) {
      // 減衰: 最初は軽く、奥にいくほど重くなる（X風）
      const damped = Math.min(diff * 0.5 + diff * diff * 0.0005, MAX_PULL)
      setPullDistance(damped)
      // スクロールを抑制
      if (diff > 10) {
        e.preventDefault()
      }
    } else {
      setPullDistance(0)
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false

    if (pullDistance >= THRESHOLD && !refreshing) {
      setReleased(true)
      setRefreshing(true)
      setPullDistance(THRESHOLD) // スピナー位置にスナップ
      router.refresh()
      await new Promise(r => setTimeout(r, 1000))
      setRefreshing(false)
      setPullDistance(0)
      setReleased(false)
    } else {
      setReleased(true)
      setPullDistance(0)
      setTimeout(() => setReleased(false), 300)
    }
  }, [pullDistance, refreshing, router])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const pastThreshold = pullDistance >= THRESHOLD

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
    >
      {/* プルインジケーター */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : '0px',
          transition: released || refreshing ? 'height 0.3s cubic-bezier(0.2, 0, 0, 1)' : 'none',
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {/* スピナー / プログレスリング */}
          <div className="relative w-8 h-8">
            <svg
              className="w-8 h-8"
              viewBox="0 0 32 32"
              style={{
                transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
                transition: released ? 'transform 0.2s ease' : 'none',
              }}
            >
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2.5"
              />
              {refreshing ? (
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeDasharray="75.4"
                  strokeDashoffset="50"
                  strokeLinecap="round"
                  className="animate-spin origin-center"
                  style={{ animationDuration: '0.8s' }}
                />
              ) : (
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke={pastThreshold ? '#f97316' : '#9ca3af'}
                  strokeWidth="2.5"
                  strokeDasharray="75.4"
                  strokeDashoffset={75.4 * (1 - progress)}
                  strokeLinecap="round"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                  }}
                />
              )}
            </svg>
            {/* 中央の矢印 */}
            {!refreshing && (
              <div
                className="absolute inset-0 flex items-center justify-center text-xs"
                style={{
                  transform: pastThreshold ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: pastThreshold ? '#f97316' : '#9ca3af',
                }}
              >
                ↓
              </div>
            )}
          </div>
          {/* テキスト */}
          {pullDistance > 20 && (
            <span
              className="text-xs font-medium transition-colors"
              style={{ color: pastThreshold ? '#f97316' : '#9ca3af' }}
            >
              {refreshing ? '更新中...' : pastThreshold ? '離して更新' : '引っ張って更新'}
            </span>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div
        style={{
          transform: pullDistance > 0 && !refreshing ? `translateY(0)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
