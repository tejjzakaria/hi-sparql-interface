import { executeSparql } from '@/lib/graphdb'

export async function POST(request: Request) {
  try {
    const { sparql } = await request.json()
    if (!sparql?.trim()) {
      return Response.json({ error: 'sparql is required' }, { status: 400 })
    }
    const results = await executeSparql(sparql)
    return Response.json({ results })
  } catch (error) {
    return Response.json({ error: 'Query failed', details: String(error) }, { status: 500 })
  }
}
