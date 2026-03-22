import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { user } = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = rateLimit(`report:${user.id}`, 5, 60_000)
  if (limited) return limited

  const { challengeId, reason, detail } = await req.json()

  if (!challengeId || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const combinedDetail = detail
    ? `[challenge:${challengeId}] ${detail}`
    : `[challenge:${challengeId}]`

  const { error } = await admin.from('reports').insert({
    reporter_id: user.id,
    reason,
    detail: combinedDetail,
    status: 'pending',
  })

  if (error) {
    console.error('Report insert error:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
