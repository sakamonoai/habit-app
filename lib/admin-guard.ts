import { getSessionUser } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/** 管理者チェック。管理者でなければ /challenges にリダイレクト */
export async function requireAdmin() {
  const { user } = await getSessionUser()
  if (!user) redirect('/login')

  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/challenges')
  }

  return { user, supabase }
}
