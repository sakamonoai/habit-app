import Image from 'next/image'

type Checkin = {
  id: string
  photo_url?: string | null
  comment?: string | null
  checked_in_at: string
  profiles?: { nickname: string } | { nickname: string }[] | null
}

export default function TimelinePreview({ checkins }: { checkins: Checkin[] }) {
  if (checkins.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
      <h3 className="font-semibold text-gray-900 mb-1">みんなの投稿</h3>
      <p className="text-xs text-gray-400 mb-4">参加者がどんな感じで取り組んでいるかチェック</p>

      <div className="space-y-3">
        {checkins.map((checkin) => {
          const profile = Array.isArray(checkin.profiles) ? checkin.profiles[0] : checkin.profiles
          const nickname = profile?.nickname ?? '匿名'
          return (
          <div key={checkin.id} className="flex gap-3">
            {/* アバター */}
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {nickname[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {nickname}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(checkin.checked_in_at).toLocaleString('ja-JP', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    timeZone: 'Asia/Tokyo'
                  })}
                </span>
              </div>

              {checkin.photo_url && (
                <div className="rounded-xl overflow-hidden mb-1" style={{ maxHeight: '160px' }}>
                  <Image
                    src={checkin.photo_url}
                    alt="記録写真"
                    width={400}
                    height={160}
                    className="w-full object-cover"
                    loading="lazy"
                    sizes="(max-width: 512px) 100vw, 400px"
                  />
                </div>
              )}

              {checkin.comment && (
                <p className="text-sm text-gray-600 line-clamp-2">{checkin.comment}</p>
              )}
            </div>
          </div>
        )})}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">参加するとすべての投稿が見られます</p>
      </div>
    </div>
  )
}
