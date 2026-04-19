import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/invite', '/api']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()
  return NextResponse.next() // Layout handle karega auth check
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}