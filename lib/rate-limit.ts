import { NextResponse } from 'next/server'

// インメモリレート制限（Vercel Serverlessでは関数インスタンスごと）
// 本格的にやるならUpstash Redisに移行
const requestCounts = new Map<string, { count: number; resetAt: number }>()

// 古いエントリを定期クリーンアップ
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, val] of requestCounts) {
    if (val.resetAt < now) requestCounts.delete(key)
  }
}

/**
 * シンプルなレート制限チェック
 * @param key ユーザーIDやIPなど一意のキー
 * @param limit ウィンドウ内の最大リクエスト数
 * @param windowMs ウィンドウの長さ（ミリ秒）
 * @returns null = OK, NextResponse = 制限超過
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  cleanup()
  const now = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++
  if (entry.count > limit) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらく待ってからお試しください。' },
      { status: 429 }
    )
  }

  return null
}
