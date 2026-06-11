"use client"

import * as React from "react"
import { toast } from "sonner"
import { FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UseCaseStep } from "@/components/submit/steps/UseCaseStep"
import { ContextStep } from "@/components/submit/steps/ContextStep"
import { AgentsStep } from "@/components/submit/steps/AgentsStep"
import { GoalsTasksStep } from "@/components/submit/steps/GoalsTasksStep"
import { ExecutionsStep } from "@/components/submit/steps/ExecutionsStep"
import { InteractionsStep } from "@/components/submit/steps/InteractionsStep"
import { EvaluationsStep } from "@/components/submit/steps/EvaluationsStep"
import { ReviewStep } from "@/components/submit/steps/ReviewStep"
import type { FormState } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step definitions ---------
const STEPS = [
  { id: 1, label: "Use Case" },
  { id: 2, label: "Context" },
  { id: 3, label: "Agents" },
  { id: 4, label: "Goals & Tasks" },
  { id: 5, label: "Executions" },
  { id: 6, label: "Interactions" },
  { id: 7, label: "Evaluations" },
  { id: 8, label: "Review" },
]

// --------- empty form ---------
function emptyState(): FormState {
  return {
    useCaseLabel: "",
    useCaseConcept: "",
    domainConcept: "",
    contextLabel: "",
    contextConcept: undefined,
    phenomenonConcepts: [],
    constraintConcepts: [],
    agents: [],
    goals: [],
    executions: [],
    interactions: [],
    evaluations: [],
  }
}

// --------- submit response ---------
interface SubmitResponse {
  id?: string
  errors?: Array<{ message: string }>
  error?: string
}

export function SubmissionWizard() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [formState, setFormState] = React.useState<FormState>(emptyState())
  const [submitter, setSubmitter] = React.useState("")
  const [terms, setTerms] = React.useState<ThesaurusTerm[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // --------- fetch thesaurus on mount ---------
  React.useEffect(() => {
    fetch("/api/sparql/thesaurus")
      .then((res) => res.json())
      .then((data: { terms: ThesaurusTerm[] }) => setTerms(data.terms ?? []))
      .catch(() => setTerms([]))
  }, [])

  function handleChange(patch: Partial<FormState>) {
    setFormState((prev) => ({ ...prev, ...patch }))
  }

  // --------- per-step validation ---------
  function validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!formState.useCaseLabel.trim()) {
          toast.error("Use case label is required.")
          return false
        }
        if (!formState.useCaseConcept) {
          toast.error("Use case concept is required.")
          return false
        }
        if (!formState.domainConcept) {
          toast.error("Domain concept is required.")
          return false
        }
        return true

      case 2:
        if (!formState.contextLabel.trim()) {
          toast.error("Context label is required.")
          return false
        }
        return true

      case 3: {
        const hasHuman = formState.agents.some((a) => a.type === "human")
        const hasAI = formState.agents.some((a) => a.type === "artificial")
        if (!hasHuman) {
          toast.error("At least one human agent is required.")
          return false
        }
        if (!hasAI) {
          toast.error("At least one artificial agent is required.")
          return false
        }
        return true
      }

      case 4:
        if (formState.goals.length === 0) {
          toast.error("At least one goal is required.")
          return false
        }
        for (const goal of formState.goals) {
          if (goal.tasks.length === 0) {
            toast.error(`Goal "${goal.label}" must have at least one task.`)
            return false
          }
        }
        return true

      case 5:
        if (formState.executions.length === 0) {
          toast.error("At least one execution is required.")
          return false
        }
        return true

      // --------- optional steps ---------
      case 6:
      case 7:
        return true

      default:
        return true
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  function handleNext() {
    if (!validateStep(currentStep)) return
    setCurrentStep((s) => Math.min(STEPS.length, s + 1))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: formState, submitter: submitter || undefined }),
      })

      if (res.status === 201) {
        toast.success("Scenario submitted for review!")
        setFormState(emptyState())
        setSubmitter("")
        setCurrentStep(1)
        return
      }

      const data: SubmitResponse = await res.json()

      if (res.status === 422 && data.errors && data.errors.length > 0) {
        toast.error(data.errors[0].message)
        return
      }

      toast.error(data.error ?? "Submission failed. Please try again.")
    } catch {
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --------- step renderer ---------
  function renderStep() {
    const props = { state: formState, onChange: handleChange, terms }
    switch (currentStep) {
      case 1: return <UseCaseStep {...props} />
      case 2: return <ContextStep {...props} />
      case 3: return <AgentsStep {...props} />
      case 4: return <GoalsTasksStep {...props} />
      case 5: return <ExecutionsStep {...props} />
      case 6: return <InteractionsStep {...props} />
      case 7: return <EvaluationsStep {...props} />
      case 8:
        return (
          <ReviewStep
            state={formState}
            terms={terms}
            submitter={submitter}
            onSubmitterChange={setSubmitter}
          />
        )
      default:
        return null
    }
  }

  const isLastStep = currentStep === STEPS.length

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      {/* --------- step indicator --------- */}
      <nav aria-label="steps" className="w-full">
        {/* --------- mobile: current label only --------- */}
        <div className="flex sm:hidden items-center justify-center">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
          </span>
        </div>

        {/* --------- desktop: all steps --------- */}
        <ol className="hidden sm:flex items-center w-full">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id
            const isFuture = currentStep < step.id
            const isNotLast = idx < STEPS.length - 1

            return (
              <React.Fragment key={step.id}>
                <li className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors"
                    style={{
                      background: isCurrent
                        ? "var(--primary)"
                        : isCompleted
                        ? "var(--primary)"
                        : "var(--surface)",
                      borderColor: isFuture ? "var(--border)" : "var(--primary)",
                      color: isCurrent || isCompleted ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {isCompleted ? <FiCheck size={12} /> : step.id}
                  </div>
                  <span
                    className="text-[10px] leading-tight text-center max-w-[56px] truncate"
                    style={{
                      color: isFuture ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                  >
                    {step.label}
                  </span>
                </li>
                {isNotLast && (
                  <div
                    className="flex-1 h-px mx-1 mt-[-14px]"
                    style={{
                      background: isCompleted ? "var(--primary)" : "var(--border)",
                    }}
                  />
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </nav>

      <Separator />

      {/* --------- step content card --------- */}
      <Card className="w-full">
        <CardContent className="pt-4 pb-4">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {STEPS[currentStep - 1].label}
          </h2>
          {renderStep()}
        </CardContent>
      </Card>

      {/* --------- navigation row --------- */}
      <div className="flex items-center justify-between gap-2">
        {currentStep > 1 ? (
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <FiChevronLeft />
            Back
          </Button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : (
              <>
                Submit
                <FiCheck />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <FiChevronRight />
          </Button>
        )}
      </div>
    </div>
  )
}
