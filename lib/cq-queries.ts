// --------- competency questions ---------

export interface CQDefinition {
  name: string
  title: string
  description: string
  paramName: string | null
  paramCategory: string | null
  defaultParam: string | null
  buildQuery: (param?: string) => string
}

export const CQ_QUERIES: Record<string, CQDefinition> = {
  'cq1-team-composition': {
    name: 'cq1-team-composition',
    title: 'Team Composition for a Use Case',
    description: 'Given a use case, how is the hybrid intelligence team composed, and what roles do its agents assume?',
    paramName: 'useCase',
    paramCategory: 'Use Case',
    defaultParam: 'https://w3id.org/hi-thesaurus/PersonalAssistantUseCase',
    buildQuery: (useCase) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?agentType ?agentTypeLabel ?roleConcept ?roleLabel ?roleDefinition
WHERE {
  VALUES ?useCaseConcept { <${useCase ?? 'https://w3id.org/hi-thesaurus/PersonalAssistantUseCase'}> }
  ?useCase hi:hasUseCaseConcept ?useCaseConcept ;
      hi:hasHITeam ?team .
  ?team hi:hasMember ?member .
  ?member a ?agentType ;
      hi:hasRoleConcept ?roleConcept .
  ?agentType rdfs:label ?agentTypeLabel .
  ?roleConcept skos:prefLabel ?roleLabel ;
      skos:definition ?roleDefinition .
}`.trim(),
  },

  'cq2-agent-tasks': {
    name: 'cq2-agent-tasks',
    title: 'Tasks an Agent Can Perform',
    description: 'Given an agent\'s capabilities, which tasks can it perform, and in which use cases can it participate?',
    paramName: 'capability',
    paramCategory: 'Capability',
    defaultParam: 'https://w3id.org/hi-thesaurus/KnowledgeGraphQueryingCapability',
    buildQuery: (capability) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?task ?taskLabel ?taskDefinition ?useCase ?useCaseConcept ?useCaseLabel
WHERE {
  VALUES ?availableCapConcept { <${capability ?? 'https://w3id.org/hi-thesaurus/KnowledgeGraphQueryingCapability'}> }
  ?capability hi:hasCapabilityConcept ?availableCapConcept ;
      hi:allowsTask ?task .
  ?task hi:hasTaskConcept ?taskConcept ;
      hi:requiresCapability ?reqCap .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
  FILTER NOT EXISTS {
    ?task hi:requiresCapability ?missingCap .
    ?missingCap hi:hasCapabilityConcept ?missingCapConcept .
    FILTER ( ?missingCapConcept != ?availableCapConcept )
  }
  ?agent hi:hasCapability ?capability .
  ?useCase hi:hasHITeam ?team ;
      hi:hasUseCaseConcept ?useCaseConcept .
  ?team hi:hasMember ?agent .
  ?useCaseConcept skos:prefLabel ?useCaseLabel .
}`.trim(),
  },

  'cq3-team-eligibility': {
    name: 'cq3-team-eligibility',
    title: 'Team Eligibility for a Goal',
    description: 'What candidate team compositions satisfy all capability requirements for achieving a specific goal?',
    paramName: 'goal',
    paramCategory: 'Goal',
    defaultParam: 'https://w3id.org/hi-thesaurus/FairAccurateVerdictGoal',
    buildQuery: (goal) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?team ?agent ?agentCapConcept ?agentCapLabel
WHERE {
  VALUES ?goalConcept { <${goal ?? 'https://w3id.org/hi-thesaurus/FairAccurateVerdictGoal'}> }
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
}`.trim(),
  },

  'cq5-interactions': {
    name: 'cq5-interactions',
    title: 'Interactions During Task Execution',
    description: 'What types of interactions occur between agents during the execution of a specific task?',
    paramName: null,
    paramCategory: null,
    defaultParam: null,
    buildQuery: () => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
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
}`.trim(),
  },

  'cq6-method-goals': {
    name: 'cq6-method-goals',
    title: 'Goals and Tasks for a Method',
    description: 'Given a method, which goals and tasks can be achieved with it?',
    paramName: 'method',
    paramCategory: 'Method',
    defaultParam: 'https://w3id.org/hi-thesaurus/SemanticLinkingMethod',
    buildQuery: (method) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?goalLabel ?goalDefinition ?taskLabel ?taskDefinition
WHERE {
  VALUES ?method { <${method ?? 'https://w3id.org/hi-thesaurus/SemanticLinkingMethod'}> }
  ?taskExecution hi:hasMethodConcept ?method ;
      hi:realizesTask ?task ;
      hi:towardsGoal ?goal .
  ?goal hi:hasGoalConcept ?goalConcept .
  ?goalConcept skos:prefLabel ?goalLabel ;
      skos:definition ?goalDefinition .
  ?task hi:hasTaskConcept ?taskConcept .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
}`.trim(),
  },

  'cq7-metric-tasks': {
    name: 'cq7-metric-tasks',
    title: 'Tasks Assessed by a Metric',
    description: 'Given an evaluation metric, which task can be assessed with it?',
    paramName: 'metric',
    paramCategory: 'Metric',
    defaultParam: 'https://w3id.org/hi-thesaurus/FairOutcomeMetric',
    buildQuery: (metric) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?task ?taskConcept ?taskLabel ?taskDefinition
WHERE {
  VALUES ?metric { <${metric ?? 'https://w3id.org/hi-thesaurus/FairOutcomeMetric'}> }
  ?experiment hi:hasMetricTested ?metric .
  ?evaluation hi:hasExperiment ?experiment .
  ?execution hi:evaluatedBy ?evaluation ;
      hi:realizesTask ?task .
  ?task hi:hasTaskConcept ?taskConcept .
  ?taskConcept skos:prefLabel ?taskLabel ;
      skos:definition ?taskDefinition .
}`.trim(),
  },

  'cq8-goal-experiments': {
    name: 'cq8-goal-experiments',
    title: 'Experiments and Metrics for a Goal',
    description: 'Given a goal, which experiments test which metrics, and what hypotheses do these experiments address?',
    paramName: 'goal',
    paramCategory: 'Goal',
    defaultParam: 'https://w3id.org/hi-thesaurus/EnhancedVisitorGoal',
    buildQuery: (goal) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?experiment ?experimentLabel ?experimentDefinition
                ?metricConcept ?metricLabel ?metricDefinition
                ?nullHypothesis ?alternativeHypothesis
WHERE {
  VALUES ?goalConcept { <${goal ?? 'https://w3id.org/hi-thesaurus/EnhancedVisitorGoal'}> }
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
}`.trim(),
  },

  'cq9-constraint-cases': {
    name: 'cq9-constraint-cases',
    title: 'Use Cases with a Contextual Constraint',
    description: 'Given a contextual constraint, which use cases are associated with it, and how does it affect the team?',
    paramName: 'constraint',
    paramCategory: 'Constraint',
    defaultParam: 'https://w3id.org/hi-thesaurus/PrivacyConstraint',
    buildQuery: (constraint) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?useCase ?useCaseConcept ?useCaseLabel ?useCaseDefinition
                ?team ?member ?roleConcept ?roleLabel ?roleDefinition
WHERE {
  VALUES ?constraint { <${constraint ?? 'https://w3id.org/hi-thesaurus/PrivacyConstraint'}> }
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
}`.trim(),
  },

  'cq10-shared-constraints': {
    name: 'cq10-shared-constraints',
    title: 'Constraints Shared Across Use Cases',
    description: 'Which constraints are shared across different use cases and agents?',
    paramName: null,
    paramCategory: null,
    defaultParam: null,
    buildQuery: () => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
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
}`.trim(),
  },

  'cq11-phenomena': {
    name: 'cq11-phenomena',
    title: 'Contextual Phenomena for a Use Case',
    description: 'Given a use case, which contextual phenomena are associated with it?',
    paramName: 'useCase',
    paramCategory: 'Use Case',
    defaultParam: 'https://w3id.org/hi-thesaurus/EnergyNegotiationUseCase',
    buildQuery: (useCase) => `
PREFIX hi:   <https://w3id.org/hi-ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?phenomenonConcept ?phenomenonLabel ?phenomenonDefinition
WHERE {
  VALUES ?useCaseConcept { <${useCase ?? 'https://w3id.org/hi-thesaurus/EnergyNegotiationUseCase'}> }
  ?useCase hi:hasUseCaseConcept ?useCaseConcept ;
      hi:hasHITeam ?team .
  ?context hi:hasInfluenceOn ?team ;
      hi:hasPhenomenonConcept ?phenomenonConcept .
  ?phenomenonConcept skos:prefLabel ?phenomenonLabel ;
      skos:definition ?phenomenonDefinition .
}`.trim(),
  },
}

// --------- category-to-cq mapping ---------
export const CATEGORY_TO_CQS: Record<string, string[]> = {
  'Use Case': ['cq1-team-composition', 'cq11-phenomena'],
  Capability: ['cq2-agent-tasks'],
  Goal: ['cq3-team-eligibility', 'cq8-goal-experiments'],
  Method: ['cq6-method-goals'],
  Metric: ['cq7-metric-tasks'],
  Constraint: ['cq9-constraint-cases'],
}
