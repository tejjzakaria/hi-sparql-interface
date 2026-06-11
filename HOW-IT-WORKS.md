# HI Query — How It Works

A plain-language explanation of what was built, why, and how the pieces fit together.

---

## What is this app?

**HI Query** is a search interface for a knowledge graph about Hybrid Intelligence — the study of humans and AI systems working together. Instead of searching through papers or text, you search through a structured database of concepts, use cases, agents, goals, tasks, and constraints that are all formally connected to each other.

The app lets a researcher type something like "privacy" or "medical diagnosis" and get back structured answers from that database — for example: which use cases are affected by a privacy constraint, or which team compositions exist for a given scenario.

---

## The three-layer stack

```
┌─────────────────────────────────────┐
│         Browser (Next.js)           │
│  Homepage · Query page · History    │
└──────────────┬──────────────────────┘
               │  HTTP
┌──────────────▼──────────────────────┐
│       Next.js API Routes            │
│  /api/sparql/thesaurus              │
│  /api/sparql/queries                │
│  /api/sparql/queries/[name]         │
└──────────────┬──────────────────────┘
               │  HTTP (SPARQL protocol)
┌──────────────▼──────────────────────┐
│         GraphDB                     │
│  localhost:7200                     │
│  Repository: hi-ontology            │
└─────────────────────────────────────┘
```

**Browser** — the Next.js frontend that users interact with. All UI is in `app/`.

**Next.js API routes** — a small backend layer that sits between the browser and GraphDB. The browser never talks to GraphDB directly; it always goes through these routes. This avoids CORS issues and keeps GraphDB access server-side.

**GraphDB** — the database. It runs locally on your machine and stores the knowledge graph. You query it using a language called SPARQL.

---

## What is the knowledge graph?

A knowledge graph is a database of *facts about things and their relationships*. Unlike a table of rows and columns, it stores a web of connected nodes.

For example, the HI knowledge graph knows things like:
- "Scenario 1 is a Personal Assistant use case"
- "That use case has a team with a human agent and an AI agent"
- "The AI agent has the Explaining capability"
- "The team operates under a Privacy constraint"
- "That Privacy constraint influences the team's context"

Every fact has this structure: **subject → predicate → object**
(e.g. `AIAssistant → hasCapability → ExplainingCapability`)

This structure lets you ask complex questions like:
*"Given a privacy constraint, which use cases does it affect, and who are the team members in those cases?"*
— and get a precise, structured answer.

---

## What are the data files (TTL)?

TTL (Turtle) is a text format for writing knowledge graphs — like JSON for a database, but for connected facts. Four files were loaded into GraphDB:

| File | What it contains |
|------|-----------------|
| `hi-ontology/hi-ontology.ttl` | The **schema** — defines what types of things can exist (Agent, Task, Goal, UseCase, Capability…) and how they can relate to each other. Like the column definitions for a database. |
| `hi-ontology/odd-extension.ttl` | An extension to the schema adding more types for operational design domains. |
| `case_study/hi-thesaurus.ttl` | A **vocabulary** of ~100 named concepts with human-readable labels and definitions — e.g. "Privacy Constraint", "Bayesian Reasoning Capability", "Personal Assistant Use Case". This is what powers autocomplete and the homepage badges. |
| `case_study/scenarios_kgs.ttl` | The **actual data** — 7 real human-AI collaboration scenarios (S1–S7) fully modelled according to the ontology. This is what gets searched when you run a query. |

---

## What is SPARQL?

SPARQL is the query language for knowledge graphs — it's to graphs what SQL is to tables.

A SPARQL query describes a *pattern* and asks the database to find all the data that matches it. For example:

```sparql
SELECT ?roleLabel ?roleDefinition
WHERE {
  <PersonalAssistantUseCase> hi:hasHITeam ?team .
  ?team hi:hasMember ?member .
  ?member hi:hasRoleConcept ?roleConcept .
  ?roleConcept skos:prefLabel ?roleLabel ;
               skos:definition ?roleDefinition .
}
```

This says: *"Start from the Personal Assistant use case, follow the hasHITeam relationship to a team, find its members, get their roles, and return the role labels and definitions."*

---

## What are Competency Questions (CQs)?

The ontology was designed to answer 11 specific research questions, called **Competency Questions**. These were defined by the ontology authors in `case_study/cqs.ipynb` as proof that the knowledge graph is useful.

Each CQ is a SPARQL query. They are:

| ID | Question |
|----|---------|
| CQ1 | Given a use case, how is the team composed and what roles do agents have? |
| CQ2 | Given an agent's capabilities, which tasks can it perform and in which use cases? |
| CQ3 | What team compositions satisfy all capability requirements for a goal? |
| CQ5 | What types of interactions occur between agents during a task? |
| CQ6 | Given a method, which goals and tasks can be achieved with it? |
| CQ7 | Given an evaluation metric, which tasks can be assessed with it? |
| CQ8 | Given a goal, which experiments test which metrics? |
| CQ9 | Given a contextual constraint, which use cases are associated with it? |
| CQ10 | Which constraints are shared across different use cases? |
| CQ11 | Given a use case, which contextual phenomena are associated with it? |

These are stored in `lib/cq-queries.ts` as TypeScript functions that build the SPARQL string. They accept an optional parameter (e.g. a specific use case URI) so the app can run them dynamically based on what the user searched for.

---

## How the search flow works

When a user types something and hits "Run Query", this is what happens:

```
1. User types "privacy"
         ↓
2. Autocomplete fetches all thesaurus terms from /api/sparql/thesaurus
   and shows matches as a dropdown
         ↓
3. User selects "Privacy Constraint"
         ↓
4. Frontend identifies the category:
   - Looks at its broader URI → "EthicalConstraint" → ends with "Constraint"
   - Category = "Constraint"
         ↓
5. Looks up which CQ handles "Constraint" queries
   → CATEGORY_TO_CQS["Constraint"] = ["cq9-constraint-cases"]
         ↓
6. Calls: GET /api/sparql/queries/cq9-constraint-cases
          ?constraint=https://w3id.org/hi-thesaurus/PrivacyConstraint
         ↓
7. Next.js API route builds the SPARQL query (injecting the URI into VALUES)
   and sends it to GraphDB
         ↓
8. GraphDB searches the knowledge graph and returns matching rows
         ↓
9. Results shown as cards. Query saved to browser history.
```

The category-to-CQ mapping lives in `lib/cq-queries.ts`:

```
Use Case   → CQ1 (team composition) + CQ11 (phenomena)
Capability → CQ2 (tasks for that capability)
Goal       → CQ3 (team eligibility) + CQ8 (experiments)
Method     → CQ6 (goals and tasks)
Metric     → CQ7 (tasks assessed by it)
Constraint → CQ9 (use cases affected by it)
```

---

## The API routes

Three endpoints, all in `app/api/sparql/`:

### `GET /api/sparql/thesaurus`
Fetches all ~100 concepts from the thesaurus (labels, definitions, category hierarchy). Used by:
- The homepage to populate the clickable badge suggestions
- The query page to power autocomplete

### `GET /api/sparql/queries`
Returns the list of all 9 CQs with their names, titles, descriptions, and what parameter type they expect. Used by the "Competency Questions" panel on the query page.

### `GET /api/sparql/queries/[name]?paramName=URI`
Runs a specific CQ. Accepts an optional query parameter to inject a specific term URI. For example:
- `/api/sparql/queries/cq9-constraint-cases?constraint=https://w3id.org/hi-thesaurus/PrivacyConstraint`
Returns the title, description, the generated SPARQL, and the results.

---

## Where data is stored locally (browser)

Two things are persisted in the browser's `localStorage` (no server or database needed):

**Query history** (`hi-query-history`)
Every time a query runs, an entry is saved:
- What the user typed
- Which CQ was run
- How many results came back
- The outcome (successful / no results / failed)
- The generated SPARQL
- Timestamp

The History page reads this and displays it with filtering, sorting, and a "Re-run" button.

**Flagged results** (`hi-flagged-results`)
When a user clicks the thumbs-down button on a result, its key is stored here. Flagged results appear faded. Flags persist across page refreshes.

---

## Key source files

```
lib/
  graphdb.ts          GraphDB HTTP client — executeSparql(), listStoredQueries()
  cq-queries.ts       All 9 CQ query definitions + category→CQ mapping
  local-storage.ts    Read/write history and flags from browser localStorage

app/
  page.tsx            Homepage — search bar + thesaurus badges
  query/page.tsx      Main query interface — autocomplete, CQ runner, results
  history/page.tsx    Query history viewer — reads from localStorage
  api/sparql/
    thesaurus/        GET endpoint for all thesaurus terms
    queries/          GET endpoint to list CQs
    queries/[name]/   GET endpoint to run a named CQ

scripts/
  setup-graphdb.mjs   One-time setup: creates repo, loads TTL files, uploads CQs

Hybrid-Intelligence-Ontology/
  hi-ontology/        Schema files (.ttl, .owl)
  case_study/         Thesaurus, scenarios data, competency questions notebook
```

---

## What is still not connected

| Feature | Status |
|---------|--------|
| Query → results flow | Done — real SPARQL results |
| Thesaurus autocomplete | Done — live from GraphDB |
| Homepage badges | Done — live from GraphDB |
| Query history | Done — localStorage |
| Result flagging | Done — localStorage |
| Competency Questions panel | Done — all 9 CQs runnable |
| Natural language understanding | Not built — matching is text-based only (does the input appear in a thesaurus label?) |
| Conversational mode | UI exists, not wired up |
| Multi-CQ results (e.g. run CQ1 + CQ11 together for a use case) | Not built — only runs the first matching CQ |
| User accounts / persistent storage across devices | Not built — localStorage is per-browser only |
