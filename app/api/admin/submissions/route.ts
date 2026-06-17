import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'
import type { Submission } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const result = await db.execute(`
      SELECT id, title, submitter, status, turtle_ttl, created_at, reviewed_at
      FROM submissions
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `)
    const submissions = result.rows as unknown as Omit<Submission, 'form_data'>[]

    return Response.json({ submissions })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch submissions', details: String(error) },
      { status: 500 }
    )
  }
}
