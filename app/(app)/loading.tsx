export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
