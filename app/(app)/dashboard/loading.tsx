export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-4 py-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full animate-pulse" />
          <div>
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-3 w-36 bg-gray-50 rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-8 w-10 bg-gray-100 rounded mx-auto mb-1" />
                <div className="h-3 w-12 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
