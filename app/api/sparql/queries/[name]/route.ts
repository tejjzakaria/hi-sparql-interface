import type { NextRequest } from 'next/server'
import { CQ_QUERIES } from '@/lib/cq-queries'
import { executeSparql } from '@/lib/graphdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const cq = CQ_QUERIES[name]

  if (!cq) {
    return Response.json({ error: `Query '${name}' not found` }, { status: 404 })
  }

  // --------- optional param injection ---------
  const url = request.nextUrl
  const paramValue = cq.paramName ? url.searchParams.get(cq.paramName) ?? undefined : undefined
  const sparql = cq.buildQuery(paramValue ?? cq.defaultParam ?? undefined)

  try {
    const results = await executeSparql(sparql)
    return Response.json({
      name: cq.name, 
      title: cq.title,
      description: cq.description,
      sparql,
      results,
    })
  } catch (error) {
    return Response.json(
      { error: 'Failed to execute query', details: String(error) },
      { status: 500 }
    )
  }
}
