#!/usr/bin/env node
// --------- graphdb setup ---------
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ONTOLOGY_DIR = join(ROOT, 'Hybrid-Intelligence-Ontology')

const GRAPHDB_URL = process.env.GRAPHDB_URL ?? 'http://localhost:7200'
const REPO = process.env.GRAPHDB_REPO ?? 'hi-ontology'

const REPO_CONFIG = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix rep: <http://www.openrdf.org/config/repository#>.
@prefix sr: <http://www.openrdf.org/config/repository/sail#>.
@prefix sail: <http://www.openrdf.org/config/sail#>.
@prefix graphdb: <http://www.ontotext.com/config/graphdb#>.

[] a rep:Repository ;
   rep:repositoryID "${REPO}" ;
   rdfs:label "Hybrid Intelligence Ontology" ;
   rep:repositoryImpl [
      rep:repositoryType "graphdb:SailRepository" ;
      sr:sailImpl [
         sail:sailType "graphdb:Sail" ;
         graphdb:ruleset "owl-horst-optimized" ;
         graphdb:read-only "false"
      ]
   ] .
`.trim()

// --------- ttl files to load ---------
const TTL_FILES = [
  join(ONTOLOGY_DIR, 'hi-ontology', 'hi-ontology.ttl'),
  join(ONTOLOGY_DIR, 'hi-ontology', 'odd-extension.ttl'),
  join(ONTOLOGY_DIR, 'case_study', 'hi-thesaurus.ttl'),
  join(ONTOLOGY_DIR, 'case_study', 'scenarios_kgs.ttl'),
]

// --------- stored queries ---------
// these mirror lib/cq-queries.ts — stored in graphdb workbench for exploration
const STORED_QUERIES = [
  {
    name: 'cq1-team-composition',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX hi-s1: <https://w3id.org/hi-ontology/scenarios/1/>

SELECT DISTINCT ?agentType ?agentTypeLabel ?roleConcept ?roleLabel ?roleDefinition
WHERE {
  VALUES ?useCase { hi-s1:UseCasePersonalAssistantHI }
  ?useCase hi:hasHITeam ?team .
  ?team hi:hasMember ?member .
  ?member a ?agentType ;
      hi:hasRoleConcept ?roleConcept .
  ?agentType rdfs:label ?agentTypeLabel .
  ?roleConcept skos:prefLabel ?roleLabel ;
      skos:definition ?roleDefinition .
}`,
  },
  {
    name: 'cq2-agent-tasks',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?task ?taskLabel ?taskDefinition ?useCase ?useCaseConcept ?useCaseLabel
WHERE {
  VALUES ?availableCapConcept { hint:KnowledgeGraphQueryingCapability hint:ExplainingCapability hint:SituationalAwarenessCapability }
  ?capability hi:hasCapabilityConcept ?availableCapConcept ;
      hi:allowsTask ?task .
  ?task hi:hasTaskConcept ?taskConcept ;
      hi:requiresCapability ?reqCap .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
  FILTER NOT EXISTS {
    ?task hi:requiresCapability ?missingCap .
    ?missingCap hi:hasCapabilityConcept ?missingCapConcept .
    FILTER ( ?missingCapConcept NOT IN (hint:KnowledgeGraphQueryingCapability, hint:ExplainingCapability, hint:SituationalAwarenessCapability))
  }
  ?agent hi:hasCapability ?capability .
  ?useCase hi:hasHITeam ?team ;
      hi:hasUseCaseConcept ?useCaseConcept .
  ?team hi:hasMember ?agent .
  ?useCaseConcept skos:prefLabel ?useCaseLabel .
}`,
  },
  {
    name: 'cq3-team-eligibility',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?team ?agent ?agentCapConcept ?agentCapLabel
WHERE {
  VALUES ?goalConcept { hint:FairAccurateVerdictGoal }
  ?goal hi:hasGoalConcept ?goalConcept ;
      hi:requiresTask ?task .
  ?task hi:requiresCapability ?reqCap .
  ?reqCap hi:hasCapabilityConcept ?reqCapConcept .
  ?team a hi:HITeam .
  FILTER NOT EXISTS {
    ?goal hi:requiresTask ?t2 .
    ?t2 hi:requiresCapability ?cap2 .
    ?cap2 hi:hasCapabilityConcept ?reqCapConcept2 .
    FILTER NOT EXISTS {
      ?team hi:hasMember ?a2 .
      ?a2 hi:hasCapability ?a2Cap .
      ?a2Cap hi:hasCapabilityConcept ?reqCapConcept2 .
    }
  }
  ?team hi:hasMember ?agent .
  ?agent hi:hasCapability ?agentCap .
  ?agentCap hi:hasCapabilityConcept ?agentCapConcept .
  ?agentCapConcept skos:prefLabel ?agentCapLabel .
}`,
  },
  {
    name: 'cq5-interactions',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?goalConcept ?task ?taskComment ?interaction ?agent
                ?intentConcept ?intentLabel ?intentDefinition
                ?modalityConcept ?modalityLabel ?modalityDefinition
WHERE {
  ?interaction a hi:Interaction ;
      hi:hasAgentInvolved ?agent ;
      hi:hasInteractionIntentConcept ?intentConcept ;
      hi:hasInteractionModalityConcept ?modalityConcept .
  ?intentConcept skos:prefLabel ?intentLabel ;
      skos:definition ?intentDefinition .
  ?modalityConcept skos:prefLabel ?modalityLabel ;
      skos:definition ?modalityDefinition .
  ?taskExecution hi:hasInteractionEpisode ?interaction ;
      hi:realizesTask ?task .
  ?task rdfs:comment ?taskComment .
  ?goal hi:requiresTask ?task ;
      hi:hasGoalConcept ?goalConcept .
}`,
  },
  {
    name: 'cq6-method-goals',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?goalLabel ?goalDefinition ?taskLabel ?taskDefinition
WHERE {
  VALUES ?method { hint:SemanticLinkingMethod }
  ?taskExecution hi:hasMethodConcept ?method ;
      hi:realizesTask ?task ;
      hi:towardsGoal ?goal .
  ?goal hi:hasGoalConcept ?goalConcept .
  ?goalConcept skos:prefLabel ?goalLabel ;
      skos:definition ?goalDefinition .
  ?task hi:hasTaskConcept ?taskConcept .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
}`,
  },
  {
    name: 'cq7-metric-tasks',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?task ?taskConcept ?taskLabel ?taskDefinition
WHERE {
  VALUES ?metric { hint:FairOutcomeMetric }
  ?experiment hi:hasMetricTested ?metric .
  ?evaluation hi:hasExperiment ?experiment .
  ?execution hi:evaluatedBy ?evaluation ;
      hi:realizesTask ?task .
  ?task hi:hasTaskConcept ?taskConcept .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
}`,
  },
  {
    name: 'cq8-goal-experiments',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?experiment ?experimentLabel ?experimentDefinition
                ?metricConcept ?metricLabel ?metricDefinition
                ?nullHypothesis ?alternativeHypothesis
WHERE {
  VALUES ?goalConcept { hint:EnhancedVisitorGoal }
  ?goal hi:hasGoalConcept ?goalConcept ;
      hi:requiresTask ?task .
  ?taskExecution hi:realizesTask ?task ;
      hi:evaluatedBy ?evaluation .
  ?evaluation hi:hasMetricConcept ?metricConcept ;
      hi:hasExperiment ?experiment .
  ?experiment hi:hasNullHypothesis ?nullHypothesis ;
      hi:hasAlternativeHypothesis ?alternativeHypothesis ;
      hi:hasExperimentConcept ?experimentConcept .
  ?experimentConcept skos:prefLabel ?experimentLabel ;
      skos:definition ?experimentDefinition .
  ?metricConcept skos:prefLabel ?metricLabel ;
      skos:definition ?metricDefinition .
}`,
  },
  {
    name: 'cq9-constraint-cases',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?useCase ?useCaseConcept ?useCaseLabel ?useCaseDefinition
                ?team ?member ?roleConcept ?roleLabel ?roleDefinition
WHERE {
  VALUES ?constraint { hint:PrivacyConstraint }
  ?context hi:hasConstraintConcept ?constraint ;
      hi:hasInfluenceOn ?team .
  ?useCase hi:hasHITeam ?team ;
      hi:hasUseCaseConcept ?useCaseConcept .
  ?useCaseConcept skos:prefLabel ?useCaseLabel ;
      skos:definition ?useCaseDefinition .
  ?team hi:hasMember ?member .
  ?member hi:hasRoleConcept ?roleConcept .
  ?roleConcept skos:prefLabel ?roleLabel ;
      skos:definition ?roleDefinition .
}`,
  },
  {
    name: 'cq10-shared-constraints',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?useCaseConcept ?useCaseLabel ?useCaseDefinition
                ?member ?roleConcept ?roleLabel ?roleDefinition
WHERE {
  ?context hi:hasConstraintConcept ?constraintConcept ;
      hi:hasInfluenceOn ?team .
  ?team hi:hasMember ?member .
  ?member hi:hasRoleConcept ?roleConcept .
  ?roleConcept skos:prefLabel ?roleLabel ;
      skos:definition ?roleDefinition .
  ?useCase hi:hasHITeam ?team ;
      hi:hasUseCaseConcept ?useCaseConcept .
  ?useCaseConcept skos:prefLabel ?useCaseLabel ;
      skos:definition ?useCaseDefinition .
}`,
  },
  {
    name: 'cq11-phenomena',
    shared: true,
    body: `PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX hi-s6: <https://w3id.org/hi-ontology/scenarios/6/>

SELECT DISTINCT ?phenomenonConcept ?phenomenonLabel ?phenomenonDefinition
WHERE {
  VALUES ?useCase { hi-s6:UseCaseCampusEnergyNegotiation }
  ?useCase hi:hasHITeam ?team .
  ?context hi:hasInfluenceOn ?team ;
      hi:hasPhenomenonConcept ?phenomenonConcept .
  ?phenomenonConcept skos:prefLabel ?phenomenonLabel ;
      skos:definition ?phenomenonDefinition .
}`,
  },
]

// --------- helpers ---------
function log(msg) {
  console.log(`  ${msg}`)
}

async function checkGraphDB() {
  try {
    const res = await fetch(`${GRAPHDB_URL}/rest/repositories`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    log(`✓ GraphDB is reachable at ${GRAPHDB_URL}`)
    return true
  } catch {
    console.error(`\n✗ Cannot reach GraphDB at ${GRAPHDB_URL}`)
    console.error('  Make sure GraphDB is running. Download from: https://graphdb.ontotext.com/')
    return false
  }
}

async function createRepository() {
  log(`Creating repository: ${REPO}`)
  const form = new FormData()
  const blob = new Blob([REPO_CONFIG], { type: 'text/turtle' })
  form.append('config', blob, 'config.ttl')

  const res = await fetch(`${GRAPHDB_URL}/rest/repositories`, {
    method: 'POST',
    body: form,
  })

  if (res.status === 201) {
    log(`✓ Repository '${REPO}' created`)
  } else if (res.status === 409) {
    log(`  Repository '${REPO}' already exists — skipping`)
  } else {
    const text = await res.text()
    throw new Error(`Failed to create repository: ${res.status} — ${text}`)
  }
}

async function loadFile(filePath) {
  const label = filePath.split('/').slice(-2).join('/')
  log(`Loading ${label}...`)
  const content = readFileSync(filePath, 'utf-8')

  const res = await fetch(`${GRAPHDB_URL}/repositories/${REPO}/statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/turtle; charset=UTF-8' },
    body: content,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to load ${label}: ${res.status} — ${text.slice(0, 200)}`)
  }
  log(`  ✓ ${label}`)
}

async function createStoredQuery(query) {
  const res = await fetch(`${GRAPHDB_URL}/rest/sparql/saved-queries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(query),
  })

  if (res.status === 201 || res.ok) {
    log(`  ✓ ${query.name}`)
  } else if (res.status === 409) {
    log(`  ∼ ${query.name} (already exists)`)
  } else {
    const text = await res.text()
    console.warn(`  ⚠ Failed to create '${query.name}': ${res.status} — ${text.slice(0, 100)}`)
  }
}

// --------- main ---------
async function main() {
  console.log('\n── HI Ontology GraphDB Setup ──\n')

  const alive = await checkGraphDB()
  if (!alive) process.exit(1)

  console.log('\n[1/3] Creating repository...')
  await createRepository()

  console.log('\n[2/3] Loading ontology files...')
  for (const file of TTL_FILES) {
    await loadFile(file)
  }

  console.log('\n[3/3] Creating stored queries...')
  for (const q of STORED_QUERIES) {
    await createStoredQuery(q)
  }

  console.log('\n✓ Setup complete!\n')
  console.log(`  SPARQL endpoint: ${GRAPHDB_URL}/repositories/${REPO}`)
  console.log(`  Workbench:       ${GRAPHDB_URL}\n`)
}

main().catch((err) => {
  console.error('\n✗ Setup failed:', err.message)
  process.exit(1)
})
