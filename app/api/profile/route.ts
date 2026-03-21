import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nickname, avatar_url, bio, sns_links } = body

  const updates: Record<string, unknown> = {}
  if (typeof nickname === 'string' && nickname.trim()) {
    updates.nickname = nickname.trim().slice(0, 20)
  }
  if (typeof avatar_url === 'string') {
    updates.avatar_url = avatar_url
  }
  if (typeof bio === 'string') {
    updates.bio = bio.slice(0, 100)
  }
  if (sns_links && typeof sns_links === 'object') {
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(sns_links)) {
      if (['twitter', 'instagram', 'youtube', 'tiktok', 'website'].includes(k) && typeof v === 'string') {
        clean[k] = (v as string).slice(0, 200)
      }
    }
    updates.sns_links = clean
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
