import type { NextRequest } from 'next/server'
import getDb from '@/lib/db'
import { generateTTL } from '@/lib/ttl-generator'
import { validateTTL } from '@/lib/shacl-validator'
import type { FormState } from '@/lib/submission-types'

export async function POST(request: NextRequest) {
  let body: { formData: FormState; submitter?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { formData, submitter } = body

  if (!formData || typeof formData !== 'object') {
    return Response.json({ error: 'formData is required' }, { status: 400 })
  }
  if (!formData.useCaseLabel?.trim()) {
    return Response.json({ error: 'formData.useCaseLabel is required' }, { status: 400 })
  }

  // --------- generate ttl ---------
  const id = crypto.randomUUID()
  const turtle = generateTTL(id, formData)

  // --------- shacl validation ---------
  const errors = await validateTTL(turtle)
  const violations = errors.filter(e => e.severity === 'violation')

  if (violations.length > 0) {
    return Response.json({ errors }, { status: 422 })
  }

  // --------- store ---------
  const db = getDb()
  db.prepare(`
    INSERT INTO submissions (id, title, submitter, status, turtle_ttl, form_data, created_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?)
  `).run(
    id,
    formData.useCaseLabel.trim(),
    submitter ?? null,
    turtle,
    JSON.stringify(formData),
    Date.now()
  )

  return Response.json({ id }, { status: 201 })
}
