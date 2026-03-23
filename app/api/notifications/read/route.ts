import { getSessionUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const { supabase, user } = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ ok: true })
}
