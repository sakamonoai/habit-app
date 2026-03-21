import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession()はJWTをローカル検証するだけ（API往復なし = 高速）
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // 認証不要のパス
  const publicPaths = ['/login', '/signup', '/callback', '/reset-password', '/update-password', '/lp']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /callback はOAuthコールバックなのでリダイレクトしない
  if (session && isPublicPath && !pathname.startsWith('/callback')) {
    return NextResponse.redirect(new URL('/challenges', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)'],
}
