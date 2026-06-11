# Scenario Upload Feature — Implementation Plan

## Overview

Users can submit new HI scenarios via a guided form at `/submit`. Submissions are stored in SQLite and await admin review at `/admin` (6-digit env password). On approval, the generated Turtle is loaded into GraphDB and becomes queryable. Invalid submissions are rejected at upload time via SHACL validation.

---

## Decisions Summary

| Decision | Choice |
|---|---|
| Auth | 6-digit admin password from `ADMIN_PASSWORD` env var; `/submit` is public |
| Upload format | Guided multi-step form → auto-generated Turtle |
| Pending storage | SQLite (`better-sqlite3`) via a local `submissions.db` file |
| Validation | SHACL runs at submit time using `rdf-validate-shacl` + `n3` |
| After approval | TTL POSTed to GraphDB `/repositories/hi-ontology/statements` |
| After rejection | Submission silently deleted from SQLite |
| Form scope | Full ontology: UseCase, HITeam, Agents, Capabilities, Goals, Tasks, TaskExecutions, Interactions, Evaluations, Experiments (ODD extension excluded) |

---

## Architecture

```
/submit (public)
  └── Multi-step form
        └── On submit → generate TTL → SHACL validate
              ├── Fail → show field-level errors, block submission
              └── Pass → INSERT into SQLite (status: pending)

/admin (password-protected)
  └── List of pending submissions
        ├── Approve → POST TTL to GraphDB → DELETE from SQLite (or mark approved)
        └── Reject  → DELETE from SQLite
```

---

## Database Schema (SQLite)

```sql
CREATE TABLE submissions (
  id          TEXT PRIMARY KEY,   -- UUID v4
  title       TEXT NOT NULL,      -- use case label (human-readable)
  submitter   TEXT,               -- optional name/email (no accounts)
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved'
  turtle_ttl  TEXT NOT NULL,      -- full generated Turtle string
  form_data   TEXT NOT NULL,      -- JSON snapshot of form state
  created_at  INTEGER NOT NULL,   -- Unix timestamp
  reviewed_at INTEGER             -- set on approve
);
```

---

## Form Steps

The form is a multi-step wizard. Each step validates locally before advancing.

### Step 1 — Use Case
- Use case label (free text, becomes the IRI slug)
- Use case concept (HINT thesaurus `Select` — fetched from `/api/sparql/thesaurus`)
- Domain concept (HINT thesaurus `Select`)

### Step 2 — Context
- Context label
- Phenomenon concepts (multi-select from HINT thesaurus)
- Constraint concepts (multi-select from HINT thesaurus)

### Step 3 — Agents
Add N agents. For each:
- Agent type: `HumanAgent` or `ArtificialAgent`
- Agent label
- Role concept (HINT thesaurus `Select`)
- Capabilities: add M capabilities, each with:
  - Capability label
  - Capability concept (HINT thesaurus `Select`)

### Step 4 — Goals & Tasks
Add N goals. For each goal:
- Goal label
- Goal concept (HINT thesaurus `Select`)
- Required tasks: add M tasks, each with:
  - Task label
  - Task concept (HINT thesaurus `Select`)
  - Required capabilities (multi-select from agents' capabilities defined in Step 3)

### Step 5 — Task Executions
Add N executions. For each:
- Execution label
- Realizes task (Select from tasks defined in Step 4)
- Performed by agent (Select from agents defined in Step 3)
- Method concept (HINT thesaurus `Select`)
- Towards goal (Select from goals defined in Step 4)

### Step 6 — Interactions
Add N interactions (optional). For each:
- Agents involved (multi-select from Step 3 agents, min 2)
- Interaction intent concept (HINT thesaurus `Select`)
- Interaction modality concept (HINT thesaurus `Select`)

### Step 7 — Evaluations & Experiments
Add N evaluations. For each evaluation:
- Evaluation concept (HINT thesaurus `Select`)
- Metric concept (HINT thesaurus `Select`)
- Linked experiment:
  - Experiment concept (HINT thesaurus `Select`)
  - Metric tested (Select from HINT thesaurus)
  - Null hypothesis (free text)
  - Alternative hypothesis (free text)

### Step 8 — Review & Submit
- Read-only summary of all entered data
- Generated Turtle preview (collapsible code block)
- SHACL validation status (runs live before this step is shown)
- Submit button → sends to `/api/submissions` (POST)

---

## TTL Generation

A server-side utility (`lib/ttl-generator.ts`) takes the validated form JSON and produces a Turtle string matching the structure of `scenarios_kgs.ttl`.

IRI slugs are derived from labels: lowercase, spaces → hyphens, prefixed with a submission-scoped namespace:
```
@prefix hi-sub: <https://w3id.org/hi-ontology/submission/{id}#> .
```

The generator emits all required triples: `rdf:type`, ontology object properties, and HINT concept references.

---

## SHACL Validation

Uses `rdf-validate-shacl` (npm) and `n3` for parsing.

Validation loads:
1. `Hybrid-Intelligence-Ontology/validation-rules/hi-shacl.ttl`
2. The generated submission TTL

Rules checked (from `hi-shacl.ttl`):
- **HITeamShape**: ≥2 members, ≥1 HumanAgent, ≥1 ArtificialAgent, ≥1 goal
- **TeamMemberRoleRequirement**: every team member has a `hi:hasRoleConcept`
- **GoalShape**: every goal requires ≥1 task
- **ExecutionShape**: every execution is `performedBy` an agent
- **TaskShape**: if an execution is linked via `hi:realizedBy`, it must be a valid Execution

Validation errors are surfaced per field on the review step. The form cannot be submitted while errors exist.

---

## API Routes

```
POST /api/submissions
  Body: { formData: FormState }
  → generate TTL → run SHACL → 422 on errors, 201 on success (returns id)

GET  /api/admin/submissions
  Header: x-admin-password
  → returns all pending submissions

DELETE /api/admin/submissions/[id]
  Header: x-admin-password
  → deletes submission (rejection)

POST /api/admin/submissions/[id]/approve
  Header: x-admin-password
  → POSTs TTL to GraphDB, deletes from SQLite
```

---

## Implementation Phases

### Phase 1 — Database & API foundation
- Install `better-sqlite3` + `@types/better-sqlite3`
- Create `lib/db.ts` (singleton SQLite connection, auto-creates schema on init)
- Implement all 4 API routes
- Add `ADMIN_PASSWORD` to `.env.local`

### Phase 2 — TTL generator
- Install `n3` (Turtle serialization)
- Build `lib/ttl-generator.ts` — pure function: `FormState → string`
- Unit-test generator output against the shape of `scenarios_kgs.ttl`

### Phase 3 — SHACL validation
- Install `rdf-validate-shacl`
- Build `lib/shacl-validator.ts` — async function: `turtleString → ValidationResult[]`
- Wire into `POST /api/submissions`

### Phase 4 — Submission form (`/submit`)
- Multi-step wizard component with step indicator
- Steps 1–7 with field-level validation (zod or manual)
- Step 8: TTL preview + validation results
- On submit: POST to `/api/submissions`, show sonner toast on success/error

### Phase 5 — Admin panel (`/admin`)
- Password gate: form → session cookie → redirect to `/admin/dashboard`
- Dashboard: table of pending submissions (title, submitter, date, TTL preview drawer)
- Approve / Reject actions with sonner confirmation toasts
- Approved submissions load into GraphDB and disappear from the queue

---

## File Additions

```
app/
├── submit/
│   └── page.tsx                     # Public submission page
├── admin/
│   ├── page.tsx                     # Password gate
│   └── dashboard/
│       └── page.tsx                 # Admin dashboard
└── api/
    ├── submissions/
    │   └── route.ts                 # POST (create submission)
    └── admin/
        └── submissions/
            ├── route.ts             # GET (list)
            └── [id]/
                ├── route.ts         # DELETE (reject)
                └── approve/
                    └── route.ts     # POST (approve + load to GraphDB)

lib/
├── db.ts                            # SQLite singleton + schema
├── ttl-generator.ts                 # FormState → Turtle string
└── shacl-validator.ts               # Turtle → SHACL ValidationResult[]

components/
└── submit/
    ├── SubmissionWizard.tsx          # Step controller
    ├── steps/
    │   ├── UseCaseStep.tsx
    │   ├── ContextStep.tsx
    │   ├── AgentsStep.tsx
    │   ├── GoalsTasksStep.tsx
    │   ├── ExecutionsStep.tsx
    │   ├── InteractionsStep.tsx
    │   ├── EvaluationsStep.tsx
    │   └── ReviewStep.tsx
    └── shared/
        └── ThesaurusSelect.tsx      # Reusable HINT thesaurus Select
```

---

## Notes & Constraints

- The HINT thesaurus `Select` components reuse the existing `/api/sparql/thesaurus` endpoint — no new SPARQL queries needed.
- GraphDB loading uses a `POST /repositories/hi-ontology/statements` with `Content-Type: text/turtle` (same pattern as the setup script).
- No email notifications — admin checks the dashboard manually.
- No submission tracking for end-users (deletion = silent rejection per decision above).
- ODD extension (directives, compliance) is excluded from the form scope; admins can manually add ODD triples post-approval if needed.
