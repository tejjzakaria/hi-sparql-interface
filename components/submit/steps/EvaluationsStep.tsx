"use client"

import * as React from "react"
import { toast } from "sonner"
import { FiTrash2 } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import type { FormState, FormEvaluation, FormExperiment } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------
interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- blank drafts ---------
interface EvaluationDraft {
  label: string
  evaluationConcept: string
  metricConcept: string
  experiment: {
    concept: string
    metricTested: string
    nullHypothesis: string
    alternativeHypothesis: string
  }
}

function blankDraft(): EvaluationDraft {
  return {
    label: "",
    evaluationConcept: "",
    metricConcept: "",
    experiment: {
      concept: "",
      metricTested: "",
      nullHypothesis: "",
      alternativeHypothesis: "",
    },
  }
}

export function EvaluationsStep({ state, onChange, terms }: StepProps) {
  const [draft, setDraft] = React.useState<EvaluationDraft>(blankDraft())

  function termLabel(uri: string) {
    return terms.find((t) => t.uri === uri)?.label ?? uri
  }

  function setExp(patch: Partial<EvaluationDraft["experiment"]>) {
    setDraft((d) => ({ ...d, experiment: { ...d.experiment, ...patch } }))
  }

  function handleAdd() {
    if (!draft.label.trim()) {
      toast.error("Evaluation label is required.")
      return
    }
    if (!draft.evaluationConcept) {
      toast.error("Please select an evaluation concept.")
      return
    }
    if (!draft.metricConcept) {
      toast.error("Please select a metric concept.")
      return
    }
    if (!draft.experiment.concept) {
      toast.error("Please select an experiment concept.")
      return
    }
    if (!draft.experiment.metricTested) {
      toast.error("Please select a metric tested for the experiment.")
      return
    }
    if (!draft.experiment.nullHypothesis.trim()) {
      toast.error("Null hypothesis is required.")
      return
    }
    if (!draft.experiment.alternativeHypothesis.trim()) {
      toast.error("Alternative hypothesis is required.")
      return
    }

    const experiment: FormExperiment = {
      id: crypto.randomUUID(),
      concept: draft.experiment.concept,
      metricTested: draft.experiment.metricTested,
      nullHypothesis: draft.experiment.nullHypothesis,
      alternativeHypothesis: draft.experiment.alternativeHypothesis,
    }

    const next: FormEvaluation = {
      id: crypto.randomUUID(),
      label: draft.label,
      evaluationConcept: draft.evaluationConcept,
      metricConcept: draft.metricConcept,
      experiment,
    }

    onChange({ evaluations: [...state.evaluations, next] })
    setDraft(blankDraft())
    toast.success("Evaluation added.")
  }

  function handleRemove(id: string) {
    onChange({ evaluations: state.evaluations.filter((ev) => ev.id !== id) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------- existing evaluations --------- */}
      {state.evaluations.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.evaluations.map((ev) => (
            <Card key={ev.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{ev.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(ev.id)}
                    aria-label="remove evaluation"
                  >
                    <FiTrash2 />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Metric: {termLabel(ev.metricConcept)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* --------- add form --------- */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Add Evaluation
        </p>

        {/* --------- label --------- */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eval-label">Label</Label>
          <Input
            id="eval-label"
            placeholder="e.g. Human-AI collaboration quality"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
        </div>

        {/* --------- evaluation concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Evaluation concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.evaluationConcept}
            onChange={(uri) => setDraft((d) => ({ ...d, evaluationConcept: uri }))}
            placeholder="Select evaluation concept…"
          />
        </div>

        {/* --------- metric concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Metric concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.metricConcept}
            onChange={(uri) => setDraft((d) => ({ ...d, metricConcept: uri }))}
            placeholder="Select metric…"
          />
        </div>

        <Separator />

        {/* --------- experiment section --------- */}
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Experiment
        </p>

        {/* --------- experiment concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Experiment concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.experiment.concept}
            onChange={(uri) => setExp({ concept: uri })}
            placeholder="Select experiment concept…"
          />
        </div>

        {/* --------- metric tested --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Metric tested</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.experiment.metricTested}
            onChange={(uri) => setExp({ metricTested: uri })}
            placeholder="Select metric tested…"
          />
        </div>

        {/* --------- null hypothesis --------- */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="null-hypo">Null hypothesis</Label>
          <Textarea
            id="null-hypo"
            placeholder="e.g. There is no significant difference…"
            value={draft.experiment.nullHypothesis}
            onChange={(e) => setExp({ nullHypothesis: e.target.value })}
          />
        </div>

        {/* --------- alternative hypothesis --------- */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alt-hypo">Alternative hypothesis</Label>
          <Textarea
            id="alt-hypo"
            placeholder="e.g. Human-AI teams outperform…"
            value={draft.experiment.alternativeHypothesis}
            onChange={(e) => setExp({ alternativeHypothesis: e.target.value })}
          />
        </div>

        <Button onClick={handleAdd} className="self-start">
          Add Evaluation
        </Button>
      </div>
    </div>
  )
}
