export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ヘッダースケルトン */}
        <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse mb-4" />
        {/* コンテンツスケルトン */}
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
