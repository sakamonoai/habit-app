'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['👍', '🔥', '💪', '👏', '❤️']

type Props = {
  checkinId: string
  initialReactions: { emoji: string; count: number; hasReacted: boolean }[]
}

export default function ReactionButton({ checkinId, initialReactions }: Props) {
  const [reactions, setReactions] = useState(initialReactions)
  const [showPicker, setShowPicker] = useState(false)
  const supabase = createClient()

  const handleReact = async (emoji: string) => {
    setShowPicker(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = reactions.find(r => r.emoji === emoji && r.hasReacted)

    if (existing) {
      // リアクション削除
      await supabase
        .from('reactions')
        .delete()
        .eq('checkin_id', checkinId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)

      setReactions(prev =>
        prev.map(r => r.emoji === emoji
          ? { ...r, count: r.count - 1, hasReacted: false }
          : r
        ).filter(r => r.count > 0)
      )
    } else {
      // リアクション追加
      await supabase
        .from('reactions')
        .insert({ checkin_id: checkinId, user_id: user.id, emoji })

      setReactions(prev => {
        const exists = prev.find(r => r.emoji === emoji)
        if (exists) {
          return prev.map(r => r.emoji === emoji
            ? { ...r, count: r.count + 1, hasReacted: true }
            : r
          )
        }
        return [...prev, { emoji, count: 1, hasReacted: true }]
      })
    }
  }

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            r.hasReacted
              ? 'bg-orange-50 border-orange-200 text-orange-600'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
          }`}
        >
          {r.emoji} {r.count}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-100"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1 flex gap-1 z-10">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-lg hover:scale-125 transition-transform px-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
