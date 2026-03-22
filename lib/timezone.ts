/**
 * 指定タイムゾーンの「今日」の開始・終了をUTC ISOで返す
 */
export function getTodayBoundsUTC(timezone: string) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  const offset = getTimezoneOffsetString(timezone)
  const todayStartUTC = new Date(`${today}T00:00:00${offset}`).toISOString()
  const todayEndUTC = new Date(`${today}T23:59:59${offset}`).toISOString()
  return { today, todayStartUTC, todayEndUTC }
}

/**
 * IANAタイムゾーンからUTCオフセット文字列を取得（例: "+09:00", "-05:00"）
 */
function getTimezoneOffsetString(timezone: string): string {
  const now = new Date()
  // そのタイムゾーンでのローカル時間部品を取得
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  const localDate = new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  )

  // ローカル時間とUTCの差分を計算
  const diffMs = localDate.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)
  const sign = diffMin >= 0 ? '+' : '-'
  const absMin = Math.abs(diffMin)
  const h = String(Math.floor(absMin / 60)).padStart(2, '0')
  const m = String(absMin % 60).padStart(2, '0')
  return `${sign}${h}:${m}`
}

/**
 * タイムゾーンの短縮表示名を返す（例: "JST", "PST", "UTC+8"）
 */
export function getTimezoneShortName(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? timezone
  } catch {
    return timezone
  }
}

/**
 * UTC差分を時間で返す（例: JST → 9, PST → -8）
 */
export function getTimezoneOffsetHours(timezone: string): number {
  const offset = getTimezoneOffsetString(timezone)
  const sign = offset[0] === '+' ? 1 : -1
  const [h, m] = offset.slice(1).split(':').map(Number)
  return sign * (h + m / 60)
}

/**
 * JSTとの時差を表示用文字列で返す（例: "1時間", "3時間半"）
 */
export function getJstDiffLabel(timezone: string): string {
  const jstOffset = 9
  const userOffset = getTimezoneOffsetHours(timezone)
  const diff = Math.abs(userOffset - jstOffset)
  if (diff === 0) return ''
  const hours = Math.floor(diff)
  const hasHalf = diff % 1 !== 0
  return hasHalf ? `${hours}時間半` : `${hours}時間`
}
