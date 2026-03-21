import Link from 'next/link'

export default function LegalFooter() {
  return (
    <footer className="mt-8 pb-6 text-center text-xs text-gray-400 space-x-3">
      <Link href="/terms" className="hover:text-gray-600 hover:underline">
        利用規約
      </Link>
      <span>|</span>
      <Link href="/privacy" className="hover:text-gray-600 hover:underline">
        プライバシーポリシー
      </Link>
      <span>|</span>
      <Link href="/tokushoho" className="hover:text-gray-600 hover:underline">
        特商法表記
      </Link>
    </footer>
  )
}
