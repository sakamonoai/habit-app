export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
          <div className="h-8 w-36 bg-gray-100 rounded-lg animate-pulse mb-3" />
          <div className="h-9 w-full bg-gray-50 rounded-full animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto pb-24">
        {[1, 2, 3].map(i => (
          <div key={i} className="px-4 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
              <div>
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ))}
      </main>
    </div>
  )
}
