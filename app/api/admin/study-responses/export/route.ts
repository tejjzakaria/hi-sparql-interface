import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { checkAdminPassword } from '@/lib/admin-auth'
import type { StudyResponse } from '@/lib/db'

function escapeCell(value: string | number | null): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString()
}

export async function GET(request: NextRequest) {
  if (!checkAdminPassword(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const result = await db.execute('SELECT * FROM study_responses ORDER BY submitted_at DESC')
    const responses = result.rows as unknown as StudyResponse[]

    const headers = [
      'id', 'participant_name', 'sparql_familiarity', 'cq_id',
      'q1', 'q2', 'q3', 'q4', 'q5_comments',
      'started_at', 'submitted_at',
    ]

    const rows = responses.map(r => [
      r.id,
      r.participant_name,
      r.sparql_familiarity,
      r.cq_id,
      r.q1, r.q2, r.q3, r.q4,
      r.q5_comments,
      formatDate(r.started_at),
      formatDate(r.submitted_at),
    ].map(escapeCell).join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': 'attachment; filename="study-responses.csv"',
      },
    })
  } catch (error) {
    return Response.json(
      { error: 'Failed to export responses', details: String(error) },
      { status: 500 }
    )
  }
}
