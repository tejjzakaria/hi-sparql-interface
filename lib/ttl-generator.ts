import type {
  FormState,
  FormAgent,
  FormGoal,
  FormExecution,
  FormInteraction,
  FormEvaluation,
} from './submission-types'

// --------- iri helpers ---------

const HI_NS = 'https://w3id.org/hi-ontology#'
const HINT_NS = 'https://w3id.org/hi-thesaurus/'

function makeSlug(label: string): string {
  return (
    label
      .trim()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') || 'Unnamed'
  )
}

function escapeLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function curie(ns: string, fullIRI: string): string {
  if (fullIRI.startsWith(ns)) return fullIRI.slice(ns.length)
  return null!
}

// --------- turtle block builder ---------

type Prop = [string, string]

function ttlBlock(subject: string, props: Prop[]): string {
  if (props.length === 0) return ''
  const lines = props.map(([p, v], i) => {
    const sep = i < props.length - 1 ? ' ;' : ' .'
    return i === 0 ? `${subject} ${p} ${v}${sep}` : `    ${p} ${v}${sep}`
  })
  return lines.join('\n')
}

function multiVal(iris: string[]): string {
  return iris.join(' , ')
}

// --------- main generator ---------

export function generateTTL(submissionId: string, state: FormState): string {
  const ns = `https://w3id.org/hi-ontology/submission/${submissionId}/`

  // --------- prefixed iri resolver ---------
  function iri(fullIRI: string): string {
    if (fullIRI.startsWith(ns)) return `sub:${fullIRI.slice(ns.length)}`
    const hi = curie(HI_NS, fullIRI)
    if (hi) return `hi:${hi}`
    const hint = curie(HINT_NS, fullIRI)
    if (hint) return `hint:${hint}`
    return `<${fullIRI}>`
  }

  // --------- iri maps ---------
  const ucIRI = `${ns}UseCase${makeSlug(state.useCaseLabel)}`
  const teamIRI = `${ns}HITeam${makeSlug(state.useCaseLabel)}`
  const ctxIRI = `${ns}Context${makeSlug(state.contextLabel)}`

  const agentIRIMap = new Map<string, string>(
    state.agents.map(a => [a.id, `${ns}Agent${makeSlug(a.label)}`])
  )

  // capabilities are scoped per-agent to avoid slug collisions
  const capIRIMap = new Map<string, string>()
  for (const agent of state.agents) {
    const agentSlug = makeSlug(agent.label)
    for (const cap of agent.capabilities) {
      capIRIMap.set(cap.id, `${ns}Capability${agentSlug}${makeSlug(cap.label)}`)
    }
  }

  // tasks are scoped per-goal
  const taskIRIMap = new Map<string, string>()
  for (const goal of state.goals) {
    const goalSlug = makeSlug(goal.label)
    for (const task of goal.tasks) {
      taskIRIMap.set(task.id, `${ns}Task${goalSlug}${makeSlug(task.label)}`)
    }
  }

  const goalIRIMap = new Map<string, string>(
    state.goals.map(g => [g.id, `${ns}Goal${makeSlug(g.label)}`])
  )
  const execIRIMap = new Map<string, string>(
    state.executions.map(e => [e.id, `${ns}Execution${makeSlug(e.label)}`])
  )
  const evalIRIMap = new Map<string, string>(
    state.evaluations.map(e => [e.id, `${ns}Evaluation${makeSlug(e.label)}`])
  )
  const expIRIMap = new Map<string, string>(
    state.evaluations.map(e => [e.id, `${ns}Experiment${makeSlug(e.label)}`])
  )
  const interactionIRIMap = new Map<string, string>(
    state.interactions.map((i, idx) => [i.id, `${ns}Interaction${idx + 1}`])
  )

  // --------- derived lookup structures ---------

  // capId → task IRIs it enables (collected from tasks.requiredCapabilityIds)
  const capAllowsTaskMap = new Map<string, string[]>()
  for (const goal of state.goals) {
    for (const task of goal.tasks) {
      for (const capId of task.requiredCapabilityIds) {
        const tIRI = taskIRIMap.get(task.id)
        if (!tIRI) continue
        const existing = capAllowsTaskMap.get(capId) ?? []
        if (!existing.includes(tIRI)) existing.push(tIRI)
        capAllowsTaskMap.set(capId, existing)
      }
    }
  }

  // agentId → execution IRIs it performs
  const agentExecMap = new Map<string, string[]>()
  for (const exec of state.executions) {
    const eIRI = execIRIMap.get(exec.id)
    if (!eIRI) continue
    const existing = agentExecMap.get(exec.agentId) ?? []
    existing.push(eIRI)
    agentExecMap.set(exec.agentId, existing)
  }

  // executionId → interaction IRIs attached to it
  const execInteractionMap = new Map<string, string[]>()
  for (const interaction of state.interactions) {
    if (!interaction.executionId) continue
    const iIRI = interactionIRIMap.get(interaction.id)
    if (!iIRI) continue
    const existing = execInteractionMap.get(interaction.executionId) ?? []
    existing.push(iIRI)
    execInteractionMap.set(interaction.executionId, existing)
  }

  // --------- section builders ---------

  function buildUseCase(): string {
    return ttlBlock(iri(ucIRI), [
      ['a', 'hi:UseCase'],
      ['hi:hasUseCaseConcept', iri(state.useCaseConcept)],
      ['hi:hasDomainConcept', iri(state.domainConcept)],
      ['hi:hasHITeam', iri(teamIRI)],
    ])
  }

  function buildTeam(): string {
    const goalRefs = state.goals.map(g => iri(goalIRIMap.get(g.id)!))
    const memberRefs = state.agents.map(a => iri(agentIRIMap.get(a.id)!))
    const props: Prop[] = [['a', 'hi:HITeam']]
    if (goalRefs.length > 0) props.push(['hi:hasGoal', multiVal(goalRefs)])
    if (memberRefs.length > 0) props.push(['hi:hasMember', multiVal(memberRefs)])
    props.push(['hi:operatesInContext', iri(ctxIRI)])
    return ttlBlock(iri(teamIRI), props)
  }

  function buildContext(): string {
    const props: Prop[] = [['a', 'hi:Context']]
    if (state.contextConcept) {
      props.push(['hi:hasContextConcept', iri(state.contextConcept)])
    }
    if (state.phenomenonConcepts.length > 0) {
      props.push(['hi:hasPhenomenonConcept', multiVal(state.phenomenonConcepts.map(iri))])
    }
    if (state.constraintConcepts.length > 0) {
      props.push(['hi:hasConstraintConcept', multiVal(state.constraintConcepts.map(iri))])
    }
    props.push(['hi:hasInfluenceOn', iri(teamIRI)])
    props.push(['rdfs:comment', `"${escapeLiteral(state.contextLabel)} context."@en`])
    return ttlBlock(iri(ctxIRI), props)
  }

  function buildGoals(): string {
    return state.goals
      .map((goal: FormGoal) => {
        const taskRefs = goal.tasks.map(t => iri(taskIRIMap.get(t.id)!))
        const props: Prop[] = [
          ['a', 'hi:Goal'],
          ['hi:hasGoalConcept', iri(goal.concept)],
        ]
        if (taskRefs.length > 0) props.push(['hi:requiresTask', multiVal(taskRefs)])
        props.push(['rdfs:comment', `"${escapeLiteral(goal.label)}"@en`])
        return ttlBlock(iri(goalIRIMap.get(goal.id)!), props)
      })
      .join('\n\n')
  }

  function buildAgents(): string {
    return state.agents
      .map((agent: FormAgent) => {
        const agentClass = agent.type === 'human' ? 'hi:HumanAgent' : 'hi:ArtificialAgent'
        const agentConcept = agent.type === 'human' ? 'hint:HumanAgent' : 'hint:ArtificialAgent'
        const capRefs = agent.capabilities.map(c => iri(capIRIMap.get(c.id)!))
        const execRefs = (agentExecMap.get(agent.id) ?? []).map(iri)

        const props: Prop[] = [
          ['a', agentClass],
          ['hi:hasAgentConcept', agentConcept],
          ['hi:hasRoleConcept', iri(agent.roleConcept)],
        ]
        if (capRefs.length > 0) props.push(['hi:hasCapability', multiVal(capRefs)])
        if (execRefs.length > 0) props.push(['hi:performsExecution', multiVal(execRefs)])

        return ttlBlock(iri(agentIRIMap.get(agent.id)!), props)
      })
      .join('\n\n')
  }

  function buildCapabilities(): string {
    const blocks: string[] = []
    for (const agent of state.agents) {
      for (const cap of agent.capabilities) {
        const cIRI = capIRIMap.get(cap.id)!
        const allowedTasks = (capAllowsTaskMap.get(cap.id) ?? []).map(iri)
        const props: Prop[] = [
          ['a', 'hi:Capability'],
          ['hi:hasCapabilityConcept', iri(cap.concept)],
        ]
        if (allowedTasks.length > 0) {
          props.push(['hi:allowsTask', multiVal(allowedTasks)])
        }
        blocks.push(ttlBlock(iri(cIRI), props))
      }
    }
    return blocks.join('\n\n')
  }

  function buildTasks(): string {
    const blocks: string[] = []
    for (const goal of state.goals) {
      for (const task of goal.tasks) {
        const tIRI = taskIRIMap.get(task.id)!
        const capRefs = task.requiredCapabilityIds.map(cId => iri(capIRIMap.get(cId)!))
        const props: Prop[] = [
          ['a', 'hi:Task'],
          ['hi:hasTaskConcept', iri(task.concept)],
        ]
        if (capRefs.length > 0) props.push(['hi:requiresCapability', multiVal(capRefs)])
        props.push(['rdfs:comment', `"${escapeLiteral(task.label)}"@en`])
        blocks.push(ttlBlock(iri(tIRI), props))
      }
    }
    return blocks.join('\n\n')
  }

  function buildExecutions(): string {
    return state.executions
      .map((exec: FormExecution) => {
        const interactionRefs = (execInteractionMap.get(exec.id) ?? []).map(iri)
        const props: Prop[] = [
          ['a', 'hi:TaskExecution'],
          ['hi:hasMethodConcept', iri(exec.methodConcept)],
          ['hi:realizesTask', iri(taskIRIMap.get(exec.taskId)!)],
          ['hi:performedBy', iri(agentIRIMap.get(exec.agentId)!)],
          ['hi:towardsGoal', iri(goalIRIMap.get(exec.goalId)!)],
        ]
        if (exec.evaluationId) {
          const evalIRI = evalIRIMap.get(exec.evaluationId)
          if (evalIRI) props.push(['hi:evaluatedBy', iri(evalIRI)])
        }
        if (interactionRefs.length > 0) {
          props.push(['hi:hasInteractionEpisode', multiVal(interactionRefs)])
        }
        return ttlBlock(iri(execIRIMap.get(exec.id)!), props)
      })
      .join('\n\n')
  }

  function buildInteractions(): string {
    return state.interactions
      .map((interaction: FormInteraction) => {
        const agentRefs = interaction.agentIds.map(aId => iri(agentIRIMap.get(aId)!))
        return ttlBlock(iri(interactionIRIMap.get(interaction.id)!), [
          ['a', 'hi:Interaction'],
          ['hi:hasAgentInvolved', multiVal(agentRefs)],
          ['hi:hasInteractionIntentConcept', iri(interaction.intentConcept)],
          ['hi:hasInteractionModalityConcept', iri(interaction.modalityConcept)],
        ])
      })
      .join('\n\n')
  }

  function buildEvaluations(): string {
    return state.evaluations
      .map((evaluation: FormEvaluation) => {
        const expIRI = expIRIMap.get(evaluation.id)!
        const evalIRI = evalIRIMap.get(evaluation.id)!
        const evalBlock = ttlBlock(iri(evalIRI), [
          ['a', 'hi:Evaluation'],
          ['hi:hasEvaluationConcept', iri(evaluation.evaluationConcept)],
          ['hi:hasMetricConcept', iri(evaluation.metricConcept)],
          ['hi:hasExperiment', iri(expIRI)],
          ['rdfs:comment', `"${escapeLiteral(evaluation.label)}"@en`],
        ])
        const exp = evaluation.experiment
        const expBlock = ttlBlock(iri(expIRI), [
          ['a', 'hi:Experiment'],
          ['hi:hasExperimentConcept', iri(exp.concept)],
          ['hi:hasMetricTested', iri(exp.metricTested)],
          ['hi:hasNullHypothesis', `"${escapeLiteral(exp.nullHypothesis)}"`],
          ['hi:hasAlternativeHypothesis', `"${escapeLiteral(exp.alternativeHypothesis)}"`],
        ])
        return `${evalBlock}\n\n${expBlock}`
      })
      .join('\n\n')
  }

  // --------- assemble ---------

  const sections = [
    `@prefix hi:   <${HI_NS}> .`,
    `@prefix hint: <${HINT_NS}> .`,
    `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`,
    `@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .`,
    `@prefix owl:  <http://www.w3.org/2002/07/owl#> .`,
    `@prefix sub:  <${ns}> .`,
    ``,
    `<https://w3id.org/hi-ontology> a owl:Ontology .`,
    ``,
    `# ----- use case -----`,
    buildUseCase(),
    ``,
    `# ----- hi team -----`,
    buildTeam(),
    ``,
    `# ----- context -----`,
    buildContext(),
    ``,
    `# ----- goals -----`,
    buildGoals(),
    ``,
    `# ----- agents -----`,
    buildAgents(),
    ``,
    `# ----- capabilities -----`,
    buildCapabilities(),
    ``,
    `# ----- tasks -----`,
    buildTasks(),
    ``,
    `# ----- task executions -----`,
    buildExecutions(),
  ]

  if (state.interactions.length > 0) {
    sections.push(``, `# ----- interactions -----`, buildInteractions())
  }

  if (state.evaluations.length > 0) {
    sections.push(``, `# ----- evaluations & experiments -----`, buildEvaluations())
  }

  return sections.join('\n')
}
