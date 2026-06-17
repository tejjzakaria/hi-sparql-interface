import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const db = await getDb()
    const result = await db.execute({
      sql: 'DELETE FROM submissions WHERE id = ?',
      args: [id],
    })

    if (result.rowsAffected === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete submission', details: String(error) },
      { status: 500 }
    )
  }
}
