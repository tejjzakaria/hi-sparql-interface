import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'
import type { Submission } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const db = await getDb()

    const queryResult = await db.execute({
      sql: 'SELECT * FROM submissions WHERE id = ? AND status = ?',
      args: [id, 'pending'],
    })
    const submission = queryResult.rows[0] as unknown as Submission | undefined

    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    // --------- mark approved ---------
    await db.execute({
      sql: 'UPDATE submissions SET status = ?, reviewed_at = ? WHERE id = ?',
      args: ['approved', Date.now(), id],
    })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: 'Failed to approve submission', details: String(error) },
      { status: 500 }
    )
  }
}
