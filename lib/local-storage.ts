// --------- localStorage utilities ---------

export interface HistoryEntry {
  id: string
  query: string
  outcome: 'successful' | 'no-results' | 'failed'
  timestamp: string
  resultCount: number
  cqName: string
  cqTitle: string
  termLabel: string | null
  sparql: string
}

const HISTORY_KEY = 'hi-query-history'
const FLAGS_KEY = 'hi-flagged-results'

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

export function addToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  const history = getHistory()
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify([newEntry, ...history].slice(0, 50)))
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function getFlaggedKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function toggleFlag(key: string): boolean {
  const flags = getFlaggedKeys()
  if (flags.has(key)) {
    flags.delete(key)
  } else {
    flags.add(key)
  }
  localStorage.setItem(FLAGS_KEY, JSON.stringify([...flags]))
  return flags.has(key)
}

export function makeFlagKey(cqName: string, index: number): string {
  return `${cqName}:${index}`
}
