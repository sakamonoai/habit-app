export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1" />
          <div className="h-4 w-40 bg-gray-50 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4 pb-28">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                  <div className="h-1.5 bg-gray-200 rounded-full" />
                </div>
                <div className="ml-4 w-12 h-12 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
