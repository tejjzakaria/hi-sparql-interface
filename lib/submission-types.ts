// --------- form state types ---------

export interface FormCapability {
  id: string
  label: string
  concept: string   // HINT thesaurus URI
}

export interface FormAgent {
  id: string
  type: 'human' | 'artificial'
  label: string
  roleConcept: string     // HINT thesaurus URI
  capabilities: FormCapability[]
}

export interface FormTask {
  id: string
  label: string
  concept: string              // HINT thesaurus URI
  requiredCapabilityIds: string[]  // references to FormCapability.id
}

export interface FormGoal {
  id: string
  label: string
  concept: string  // HINT thesaurus URI
  tasks: FormTask[]
}

export interface FormExecution {
  id: string
  label: string
  taskId: string      // reference to a FormTask.id (across all goals)
  agentId: string     // reference to a FormAgent.id
  methodConcept: string  // HINT thesaurus URI
  goalId: string      // reference to a FormGoal.id
  evaluationId?: string  // optional reference to a FormEvaluation.id
}

export interface FormInteraction {
  id: string
  agentIds: string[]      // references to FormAgent.id (min 2)
  intentConcept: string   // HINT thesaurus URI
  modalityConcept: string // HINT thesaurus URI
  executionId?: string    // optional link to FormExecution.id
}

export interface FormExperiment {
  id: string
  concept: string          // HINT thesaurus URI
  metricTested: string     // HINT thesaurus URI
  nullHypothesis: string
  alternativeHypothesis: string
}

export interface FormEvaluation {
  id: string
  label: string
  evaluationConcept: string  // HINT thesaurus URI
  metricConcept: string      // HINT thesaurus URI
  experiment: FormExperiment
}

export interface FormState {
  // step 1 — use case
  useCaseLabel: string
  useCaseConcept: string   // HINT thesaurus URI
  domainConcept: string    // HINT thesaurus URI

  // step 2 — context
  contextLabel: string
  contextConcept?: string        // HINT thesaurus URI (optional)
  phenomenonConcepts: string[]   // HINT thesaurus URIs
  constraintConcepts: string[]   // HINT thesaurus URIs

  // step 3 — agents
  agents: FormAgent[]

  // step 4 — goals & tasks
  goals: FormGoal[]

  // step 5 — task executions
  executions: FormExecution[]

  // step 6 — interactions
  interactions: FormInteraction[]

  // step 7 — evaluations & experiments
  evaluations: FormEvaluation[]
}
