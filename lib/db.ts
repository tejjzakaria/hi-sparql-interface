import Database from 'better-sqlite3'
import path from 'path'

// --------- sqlite singleton ---------
const DB_PATH = path.join(process.cwd(), 'submissions.db')

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined
}

function getDb(): Database.Database {
  if (!globalThis.__db) {
    const db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.exec(`
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
    globalThis.__db = db
  }
  return globalThis.__db
}

export default getDb

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
