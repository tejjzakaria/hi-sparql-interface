# HI Query Interface

A natural language search interface for the **Hybrid Intelligence (HI) knowledge graph** — a semantic database of concepts, relationships, and research about human-AI collaboration. Users search using domain terms rather than writing SPARQL, and the interface translates those terms into structured queries against a GraphDB triple store.

---

## What It Does

Instead of text search, queries target a formal ontology. A user types a concept like "Privacy Constraint" or "Medical Diagnosis", the interface matches it to a thesaurus term, selects the appropriate competency question (CQ), builds a SPARQL query, and returns structured results from the knowledge graph.

The interface also supports:
- Browsing all 11 predefined competency questions
- Submitting new hybrid intelligence scenarios (multi-step wizard)
- Running usability studies with participants
- Admin review of submissions and study responses

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page with search bar and thesaurus term badges |
| `/query` | Main query interface — autocomplete search, CQ browser, results |
| `/history` | Past queries with filter, sort, re-run, and SPARQL inspection |
| `/submit` | 8-step wizard to submit a new HI scenario |
| `/help` | Onboarding guide, interaction modes, FAQ |
| `/study` | Usability study flow for research participants |
| `/admin` | Password-protected admin login |
| `/admin/dashboard` | Approve/reject submissions; view and export study responses |

---

## Query Flow

1. **Autocomplete** — user types a term; `/api/sparql/thesaurus` returns all ~100 thesaurus terms (URI, label, definition, broader concept); the frontend filters in real time
2. **Term selection** — the selected term's ontology category (e.g. `Constraint`) maps to one or more CQs
3. **CQ execution** — `GET /api/sparql/queries/[name]?paramName=URI` builds the SPARQL query and sends it to GraphDB
4. **Results** — returned as SPARQL bindings and displayed as cards (list or grid view), with sort and filter controls
5. **History** — the query, outcome, result count, full SPARQL, and timestamp are saved to localStorage

---

## Competency Questions

11 predefined CQs cover different facets of HI scenarios:

| Category | Example CQ |
|---|---|
| Use Case | What agents form the team for this use case? |
| Capability | Which tasks require this capability? |
| Goal | Which teams are eligible for this goal? |
| Method | What goals and tasks use this method? |
| Metric | How is performance assessed for this task? |
| Constraint | Which use cases are affected by this constraint? |

Each CQ has a name, title, description, parameter type, and a `buildQuery(param)` function that injects the selected thesaurus URI into SPARQL.

---

## Scenario Submission

An 8-step wizard collects:

1. Use case (label + concept)
2. Context (phenomena, constraints)
3. Agents (human/AI with roles and capabilities)
4. Goals and tasks
5. Executions (task-to-agent assignments)
6. Interactions (agent communication)
7. Evaluations and experiments
8. Review and submit

On submission, form data is converted to Turtle (TTL) by `lib/ttl-generator.ts`, validated against SHACL shapes in `Hybrid-Intelligence-Ontology/validation-rules/hi-shacl.ttl`, then stored in SQLite with status `pending` until an admin approves it. Approval loads the TTL into GraphDB.

---

## Usability Study

The `/study` page runs a structured session for research participants:

1. **Intro** — participant enters name and SPARQL familiarity level
2. **Task** — a competency question is randomly assigned; guidance sidebar shows context, step-by-step hints, and example terms; the query interface loads in an iframe
3. **Questionnaire** — 4 Likert-scale statements (1–5), optional free-text comments
4. **Done** — response saved to the `study_responses` SQLite table

Admins can view all responses in the dashboard and export them as CSV.

---

## Admin

- **Login** — password checked against `ADMIN_PASSWORD` env var; sets a session cookie
- **Submissions tab** — table of pending scenarios; preview TTL, approve (pushes to GraphDB), or reject
- **Responses tab** — table of study responses; CSV export

---

## Data Layer

| Layer | Technology |
|---|---|
| Knowledge graph | GraphDB triple store at `localhost:7200` |
| Submissions & study data | SQLite via `better-sqlite3` (`submissions.db`) |
| Query history & flags | Browser localStorage |
| Ontology format | Turtle (TTL), SHACL validation |
| RDF parsing | N3, rdf-validate-shacl |

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `GRAPHDB_URL` | `http://localhost:7200` | GraphDB endpoint |
| `GRAPHDB_REPO` | `hi-ontology` | Repository name |
| `ADMIN_PASSWORD` | — | Admin login password |

---

## Tech Stack

- **Framework:** Next.js, React 19, TypeScript
- **UI:** shadcn/ui, Tailwind CSS, Radix UI primitives
- **Icons:** react-icons
- **Notifications:** Sonner toasts
- **Database:** better-sqlite3 (SQLite)
