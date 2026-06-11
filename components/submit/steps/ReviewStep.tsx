"use client"

import * as React from "react"
import { FiCheckCircle, FiChevronDown, FiChevronUp } from "react-icons/fi"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { FormState } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"
import type { ValidationError } from "@/lib/shacl-validator"

// --------- props ---------
interface ReviewStepProps {
  state: FormState
  terms: ThesaurusTerm[]
  submitter: string
  onSubmitterChange: (v: string) => void
}

// --------- validate response ---------
interface ValidateResponse {
  turtle: string
  errors: ValidationError[]
  conforms: boolean
}

export function ReviewStep({ state, terms, submitter, onSubmitterChange }: ReviewStepProps) {
  const [loading, setLoading] = React.useState(true)
  const [result, setResult] = React.useState<ValidateResponse | null>(null)
  const [ttlOpen, setTtlOpen] = React.useState(false)

  // --------- run validation on mount ---------
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResult(null)

    fetch("/api/submissions/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: state }),
    })
      .then((res) => res.json())
      .then((data: ValidateResponse) => {
        if (!cancelled) setResult(data)
      })
      .catch(() => {
        if (!cancelled) setResult(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // --------- run once on mount ---------
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function termLabel(uri: string) {
    return terms.find((t) => t.uri === uri)?.label ?? uri
  }

  const violations = result?.errors.filter((e) => e.severity === "violation") ?? []
  const warnings = result?.errors.filter((e) => e.severity === "warning") ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* --------- summary --------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Summary
        </p>
        <div className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Use case: {state.useCaseLabel || <em>untitled</em>}</span>
          <span>Domain: {state.domainConcept ? termLabel(state.domainConcept) : "—"}</span>
          <span>Agents: {state.agents.length}</span>
          <span>Goals: {state.goals.length}</span>
          <span>Executions: {state.executions.length}</span>
        </div>
      </div>

      <Separator />

      {/* --------- submitter name --------- */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submitter-name">Your name (optional)</Label>
        <Input
          id="submitter-name"
          placeholder="e.g. Jane Smith"
          value={submitter}
          onChange={(e) => onSubmitterChange(e.target.value)}
        />
      </div>

      <Separator />

      {/* --------- validation status --------- */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Validation
        </p>

        {loading && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}

        {!loading && result === null && (
          <Alert variant="destructive">
            <AlertTitle>Validation unavailable</AlertTitle>
            <AlertDescription>
              Could not reach the validation endpoint. You may still attempt to submit.
            </AlertDescription>
          </Alert>
        )}

        {!loading && result !== null && violations.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Violations found</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {violations.map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {!loading && result !== null && violations.length === 0 && warnings.length > 0 && (
          <Alert className="border-yellow-400/60 bg-yellow-50/50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {!loading && result !== null && result.conforms && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <FiCheckCircle className="shrink-0" />
            Ready to submit
          </div>
        )}
      </div>

      <Separator />

      {/* --------- ttl preview --------- */}
      {result?.turtle && (
        <Collapsible open={ttlOpen} onOpenChange={setTtlOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>View generated Turtle</span>
              {ttlOpen ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre
              className="mt-2 rounded-lg border border-input p-3 text-[11px] font-mono overflow-x-auto"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
              }}
            >
              {result.turtle}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
