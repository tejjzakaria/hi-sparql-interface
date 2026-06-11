import type { NextRequest } from 'next/server'
import { generateTTL } from '@/lib/ttl-generator'
import { validateTTL } from '@/lib/shacl-validator'
import type { FormState } from '@/lib/submission-types'

// --------- preview validation (no db write) ---------
export async function POST(request: NextRequest) {
  let body: { formData: FormState }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { formData } = body

  if (!formData || typeof formData !== 'object') {
    return Response.json({ error: 'formData is required' }, { status: 400 })
  }

  const draftId = 'preview'
  const turtle = generateTTL(draftId, formData)
  const errors = await validateTTL(turtle)

  return Response.json({ turtle, errors, conforms: errors.filter(e => e.severity === 'violation').length === 0 })
}
