import SHACLValidator from 'rdf-validate-shacl'
import { Parser, Store } from 'n3'
import { readFileSync } from 'fs'
import path from 'path'

// --------- types ---------

export interface ValidationError {
  message: string
  path: string | undefined
  focusNode: string | undefined
  severity: 'violation' | 'warning' | 'info'
}

// --------- shapes cache ---------

declare global {
  // eslint-disable-next-line no-var
  var __shaclShapesStore: Store | undefined
}

const SHACL_PATH = path.join(
  process.cwd(),
  'Hybrid-Intelligence-Ontology/validation-rules/hi-shacl.ttl'
)

function parseTTL(content: string): Store {
  const parser = new Parser()
  const quads = parser.parse(content)
  return new Store(quads)
}

function getShapesStore(): Store {
  if (!globalThis.__shaclShapesStore) {
    const ttl = readFileSync(SHACL_PATH, 'utf-8')
    globalThis.__shaclShapesStore = parseTTL(ttl)
  }
  return globalThis.__shaclShapesStore
}

function toSeverity(iri: string | undefined): 'violation' | 'warning' | 'info' {
  if (!iri) return 'violation'
  if (iri.endsWith('Violation')) return 'violation'
  if (iri.endsWith('Warning')) return 'warning'
  return 'info'
}

// --------- validator ---------

export async function validateTTL(turtleString: string): Promise<ValidationError[]> {
  let dataStore: Store
  try {
    dataStore = parseTTL(turtleString)
  } catch (err) {
    return [
      {
        message: `Invalid Turtle syntax: ${String(err)}`,
        path: undefined,
        focusNode: undefined,
        severity: 'violation',
      },
    ]
  }

  const shapesStore = getShapesStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validator = new SHACLValidator(shapesStore as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report = await validator.validate(dataStore as any)

  if (report.conforms) return []

  return report.results.map(result => ({
    message:
      result.message.map((m: { value: string }) => m.value).join('; ') ||
      'Validation failed',
    path: result.path?.value,
    focusNode: result.focusNode?.value,
    severity: toSeverity(result.severity?.value),
  }))
}
