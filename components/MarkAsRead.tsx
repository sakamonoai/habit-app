'use client'

import { useEffect } from 'react'

export default function MarkAsRead() {
  useEffect(() => {
    fetch('/api/notifications/read', { method: 'POST' })
  }, [])

  return null
}
