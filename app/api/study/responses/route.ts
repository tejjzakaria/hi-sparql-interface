import { randomUUID } from 'crypto'
import getDb from '@/lib/db'
import type { StudyResponse } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      participant_name,
      sparql_familiarity,
      cq_id,
      cq_answer,
      q1, q2, q3, q4,
      q5_comments,
      started_at,
    } = body

    // --------- basic validation ---------
    if (
      !participant_name?.trim() ||
      !['basic', 'experienced'].includes(sparql_familiarity) ||
      !cq_id?.trim() ||
      [q1, q2, q3, q4].some(v => !Number.isInteger(v) || v < 1 || v > 5)
    ) {
      return Response.json({ error: 'Invalid payload' }, { status: 422 })
    }

    const row: StudyResponse = {
      id: randomUUID(),
      participant_name: participant_name.trim(),
      sparql_familiarity,
      cq_id,
      cq_answer: cq_answer?.trim() || null,
      q1, q2, q3, q4,
      q5_comments: q5_comments?.trim() || null,
      started_at: Number(started_at) || Date.now(),
      submitted_at: Date.now(),
    }

    const db = await getDb()
    await db.execute({
      sql: `
        INSERT INTO study_responses
          (id, participant_name, sparql_familiarity, cq_id, cq_answer, q1, q2, q3, q4, q5_comments, started_at, submitted_at)
        VALUES
          (@id, @participant_name, @sparql_familiarity, @cq_id, @cq_answer, @q1, @q2, @q3, @q4, @q5_comments, @started_at, @submitted_at)
      `,
      args: row as unknown as Record<string, string | number | null>,
    })

    return Response.json({ id: row.id }, { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Failed to save response', details: String(error) }, { status: 500 })
  }
}
