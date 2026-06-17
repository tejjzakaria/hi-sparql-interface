import { Store, Parser } from 'n3'
import { QueryEngine } from '@comunica/query-sparql'
import { readFileSync } from 'fs'
import path from 'path'

// --------- interfaces ---------
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

// --------- ttl files ---------
const TTL_FILES = [
  'Hybrid-Intelligence-Ontology/hi-ontology/hi-ontology.ttl',
  'Hybrid-Intelligence-Ontology/hi-ontology/odd-extension.ttl',
  'Hybrid-Intelligence-Ontology/case_study/hi-thesaurus.ttl',
  'Hybrid-Intelligence-Ontology/case_study/scenarios_kgs.ttl',
]

// --------- store singleton ---------
declare global {
  // eslint-disable-next-line no-var
  var __rdfStore: Store | undefined
  // eslint-disable-next-line no-var
  var __queryEngine: QueryEngine | undefined
}

function getStore(): { store: Store; engine: QueryEngine } {
  if (!globalThis.__rdfStore) {
    const store = new Store()
    const parser = new Parser()
    for (const file of TTL_FILES) {
      const content = readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), file), 'utf-8')
      store.addQuads(parser.parse(content))
    }
    globalThis.__rdfStore = store
    globalThis.__queryEngine = new QueryEngine()
  }
  return { store: globalThis.__rdfStore!, engine: globalThis.__queryEngine! }
}

export async function executeSparql(query: string): Promise<SparqlResults> {
  const { store, engine } = getStore()
  const bindingsStream = await engine.queryBindings(query, { sources: [store] })
  const bindings = await bindingsStream.toArray()

  const vars = bindings.length > 0 ? [...bindings[0].keys()].map(v => v.value) : []

  const resultBindings: SparqlBinding[] = bindings.map(binding => {
    const row: SparqlBinding = {}
    for (const [variable, term] of binding) {
      const entry: SparqlBinding[string] = {
        type: term.termType === 'NamedNode' ? 'uri' : term.termType === 'BlankNode' ? 'bnode' : 'literal',
        value: term.value,
      }
      if (term.termType === 'Literal') {
        if (term.language) entry['xml:lang'] = term.language
        if (term.datatype) entry.datatype = term.datatype.value
      }
      row[variable.value] = entry
    }
    return row
  })

  return {
    head: { vars },
    results: { bindings: resultBindings },
  }
}

// --------- stubs - graphdb workbench no longer used ---------
export async function listStoredQueries(): Promise<StoredQuery[]> {
  return []
}

export async function getStoredQuery(_name: string): Promise<StoredQuery | null> {
  return null
}
