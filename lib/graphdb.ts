// --------- graphdb client ---------
const GRAPHDB_URL = process.env.GRAPHDB_URL ?? 'http://localhost:7200'
const GRAPHDB_REPO = process.env.GRAPHDB_REPO ?? 'hi-ontology'

export const SPARQL_ENDPOINT = `${GRAPHDB_URL}/repositories/${GRAPHDB_REPO}`
export const SAVED_QUERIES_URL = `${GRAPHDB_URL}/rest/sparql/saved-queries`

export interface SparqlBinding {
  [key: string]: { type: string; value: string; 'xml:lang'?: string; datatype?: string }
}

export interface SparqlResults {
  head: { vars: string[] }
  results: { bindings: SparqlBinding[] }
}

export interface ThesaurusTerm {
  uri: string
  label: string
  definition: string
  broader: string | null
  broaderLabel: string | null
}

export interface StoredQuery {
  name: string
  body: string
  shared: boolean
}

export async function executeSparql(query: string): Promise<SparqlResults> {
  const res = await fetch(SPARQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      Accept: 'application/sparql-results+json',
    },
    body: query,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GraphDB ${res.status}: ${await res.text()}`)
  return res.json() as Promise<SparqlResults>
}

export async function listStoredQueries(): Promise<StoredQuery[]> {
  const res = await fetch(SAVED_QUERIES_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json() as Promise<StoredQuery[]>
}

export async function getStoredQuery(name: string): Promise<StoredQuery | null> {
  const res = await fetch(`${SAVED_QUERIES_URL}?name=${encodeURIComponent(name)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json() as Promise<StoredQuery>
}
