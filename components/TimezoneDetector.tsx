'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TimezoneDetector() {
  useEffect(() => {
    const detect = async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!tz) return

      // 前回保存済みならスキップ
      const saved = localStorage.getItem('user_timezone')
      if (saved === tz) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({ timezone: tz })
        .eq('id', user.id)

      localStorage.setItem('user_timezone', tz)
    }
    detect()
  }, [])

  return null
}
