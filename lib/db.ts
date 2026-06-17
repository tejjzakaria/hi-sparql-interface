import { createClient } from '@libsql/client'

// --------- client singleton ---------
declare global {
  // eslint-disable-next-line no-var
  var __dbReady: Promise<ReturnType<typeof createClient>> | undefined
}

async function init() {
  const client = createClient({
    url: process.env.TURSO_URL ?? 'file:submissions.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  await client.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      submitter   TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      turtle_ttl  TEXT NOT NULL,
      form_data   TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      reviewed_at INTEGER
    )
  `)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS study_responses (
      id                  TEXT PRIMARY KEY,
      participant_name    TEXT NOT NULL,
      sparql_familiarity  TEXT NOT NULL,
      cq_id               TEXT NOT NULL,
      cq_answer           TEXT,
      q1                  INTEGER NOT NULL,
      q2                  INTEGER NOT NULL,
      q3                  INTEGER NOT NULL,
      q4                  INTEGER NOT NULL,
      q5_comments         TEXT,
      started_at          INTEGER NOT NULL,
      submitted_at        INTEGER NOT NULL
    )
  `)
  // --------- migrate existing tables ---------
  try {
    await client.execute(`ALTER TABLE study_responses ADD COLUMN cq_answer TEXT`)
  } catch {
    // column already exists
  }
  return client
}

export default function getDb(): Promise<ReturnType<typeof createClient>> {
  if (!globalThis.__dbReady) {
    globalThis.__dbReady = init()
  }
  return globalThis.__dbReady
}

export interface Submission {
  id: string
  title: string
  submitter: string | null
  status: 'pending' | 'approved'
  turtle_ttl: string
  form_data: string
  created_at: number
  reviewed_at: number | null
}

export type SubmissionRow = Omit<Submission, 'turtle_ttl' | 'form_data'>

export interface StudyResponse {
  id: string
  participant_name: string
  sparql_familiarity: 'basic' | 'experienced'
  cq_id: string
  cq_answer: string | null
  q1: number
  q2: number
  q3: number
  q4: number
  q5_comments: string | null
  started_at: number
  submitted_at: number
}
