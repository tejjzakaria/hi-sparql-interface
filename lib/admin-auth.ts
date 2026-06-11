// --------- cookie parser ---------
function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=')
    if (idx < 0) continue
    result[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  }
  return result
}

// --------- password check ---------
export function checkAdminPassword(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false

  // header-based (api clients / tests)
  const header = request.headers.get('x-admin-password')
  if (header === expected) return true

  // cookie-based (browser dashboard)
  const cookies = parseCookies(request.headers.get('cookie') ?? '')
  return cookies['admin_session'] === expected
}
