import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'
import type { StudyResponse } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const result = await db.execute('SELECT * FROM study_responses ORDER BY submitted_at DESC')
    const responses = result.rows as unknown as StudyResponse[]

    return Response.json({ responses })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch responses', details: String(error) },
      { status: 500 }
    )
  }
}
