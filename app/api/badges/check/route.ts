import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// チェックイン後に呼ばれ、100%達成ならバッジを付与
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenge_id, member_id, duration_days } = await req.json()
  if (!challenge_id || !member_id || !duration_days) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // チェックイン数を取得
  const { count } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', member_id)

  if ((count ?? 0) >= duration_days) {
    // 100%達成 → バッジ付与
    await supabase
      .from('badges')
      .upsert({
        user_id: user.id,
        challenge_id,
        badge_type: 'perfect',
      }, { onConflict: 'user_id,challenge_id,badge_type' })

    return NextResponse.json({ badge_earned: true })
  }

  return NextResponse.json({ badge_earned: false })
}
