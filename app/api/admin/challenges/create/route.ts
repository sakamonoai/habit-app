import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { user } = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // 管理者チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    title,
    description,
    category,
    scheduleType,
    durationDays,
    startDate,
    endDate,
    depositType,
    depositAmount,
    maxMembers,
    thumbnailUrl,
    okPhotoUrl,
    ngPhotoUrl,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 })
  }

  // チャレンジ作成
  const { data: challenge, error: createError } = await supabase
    .from('challenges')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category || null,
      schedule_type: scheduleType || 'flexible',
      duration_days: durationDays || 7,
      start_date: scheduleType === 'fixed' ? startDate : null,
      end_date: scheduleType === 'fixed' ? endDate : null,
      deposit_type: depositType || 'choosable',
      deposit_amount: depositType === 'fixed' ? (depositAmount || 1000) : 1000,
      max_group_size: maxMembers || 10,
      status: 'active',
      created_by: user.id,
      is_official: true,
      thumbnail_url: thumbnailUrl || null,
      ok_photo_url: okPhotoUrl || null,
      ng_photo_url: ngPhotoUrl || null,
    })
    .select('id')
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // グループも自動作成
  await supabase.from('groups').insert({
    challenge_id: challenge.id,
  })

  return NextResponse.json({ id: challenge.id })
}
