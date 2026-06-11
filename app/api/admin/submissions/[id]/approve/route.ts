import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'
import type { Submission } from '@/lib/db'

const GRAPHDB_URL = process.env.GRAPHDB_URL ?? 'http://localhost:7200'
const GRAPHDB_REPO = process.env.GRAPHDB_REPO ?? 'hi-ontology'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const db = getDb()

    const submission = db.prepare(
      'SELECT * FROM submissions WHERE id = ? AND status = ?'
    ).get(id, 'pending') as Submission | undefined

    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    // --------- load ttl into graphdb ---------
    const graphdbRes = await fetch(
      `${GRAPHDB_URL}/repositories/${GRAPHDB_REPO}/statements`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/turtle; charset=UTF-8' },
        body: submission.turtle_ttl,
      }
    )

    if (!graphdbRes.ok) {
      const text = await graphdbRes.text()
      return Response.json(
        { error: 'GraphDB rejected the Turtle', details: text.slice(0, 300) },
        { status: 502 }
      )
    }

    db.prepare(
      'DELETE FROM submissions WHERE id = ?'
    ).run(id)

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: 'Failed to approve submission', details: String(error) },
      { status: 500 }
    )
  }
}
