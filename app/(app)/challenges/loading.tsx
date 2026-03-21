export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-16 bg-orange-100 rounded-xl animate-pulse" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl animate-pulse" />
              <div className="h-3 w-10 bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </header>
      <main className="max-w-lg mx-auto pb-24">
        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="aspect-[4/5] bg-gray-50 rounded-2xl animate-pulse" />
              <div className="pt-2">
                <div className="h-3 w-16 bg-gray-50 rounded animate-pulse mb-1" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
