import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const COOKIE = 'admin_session'
const MAX_AGE = 60 * 60 * 8  // 8 hours

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { password } = body as { password?: string }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected || password !== expected) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, password, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: MAX_AGE,
  })
  return res
}

// --------- logout ---------
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
