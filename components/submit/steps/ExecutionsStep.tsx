"use client"

import * as React from "react"
import { toast } from "sonner"
import { FiTrash2 } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import type { FormState, FormExecution } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------
interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- blank execution ---------
function blankExecution(): Omit<FormExecution, "id"> {
  return {
    label: "",
    taskId: "",
    agentId: "",
    methodConcept: "",
    goalId: "",
    evaluationId: undefined,
  }
}

export function ExecutionsStep({ state, onChange, terms }: StepProps) {
  const [draft, setDraft] = React.useState<Omit<FormExecution, "id">>(blankExecution())

  // --------- flat task list ---------
  const allTasks = state.goals.flatMap((g) => g.tasks)

  function handleAdd() {
    if (!draft.label.trim()) {
      toast.error("Execution label is required.")
      return
    }
    if (!draft.taskId) {
      toast.error("Please select a task.")
      return
    }
    if (!draft.agentId) {
      toast.error("Please select an agent.")
      return
    }
    if (!draft.methodConcept) {
      toast.error("Please select a method concept.")
      return
    }
    if (!draft.goalId) {
      toast.error("Please select a goal.")
      return
    }

    const next: FormExecution = {
      id: crypto.randomUUID(),
      ...draft,
      evaluationId: draft.evaluationId || undefined,
    }
    onChange({ executions: [...state.executions, next] })
    setDraft(blankExecution())
    toast.success("Execution added.")
  }

  function handleRemove(id: string) {
    onChange({ executions: state.executions.filter((e) => e.id !== id) })
  }

  function taskLabel(taskId: string) {
    return allTasks.find((t) => t.id === taskId)?.label ?? taskId
  }

  function agentLabel(agentId: string) {
    return state.agents.find((a) => a.id === agentId)?.label ?? agentId
  }

  function goalLabel(goalId: string) {
    return state.goals.find((g) => g.id === goalId)?.label ?? goalId
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------- existing executions --------- */}
      {state.executions.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.executions.map((exec) => (
            <Card key={exec.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{exec.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(exec.id)}
                    aria-label="remove execution"
                  >
                    <FiTrash2 />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Realizes task: {taskLabel(exec.taskId)}</span>
                <span>Performed by: {agentLabel(exec.agentId)}</span>
                <span>Towards goal: {goalLabel(exec.goalId)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* --------- add form --------- */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Add Execution
        </p>

        {/* --------- label --------- */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exec-label">Label</Label>
          <Input
            id="exec-label"
            placeholder="e.g. Human reviews AI output"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
        </div>

        {/* --------- task --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Task</Label>
          <Select
            value={draft.taskId}
            onValueChange={(v) => setDraft((d) => ({ ...d, taskId: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a task…" />
            </SelectTrigger>
            <SelectContent>
              {allTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --------- agent --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Agent</Label>
          <Select
            value={draft.agentId}
            onValueChange={(v) => setDraft((d) => ({ ...d, agentId: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an agent…" />
            </SelectTrigger>
            <SelectContent>
              {state.agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label} ({a.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --------- method concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Method concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.methodConcept}
            onChange={(uri) => setDraft((d) => ({ ...d, methodConcept: uri }))}
            placeholder="Select method…"
          />
        </div>

        {/* --------- goal --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Goal</Label>
          <Select
            value={draft.goalId}
            onValueChange={(v) => setDraft((d) => ({ ...d, goalId: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a goal…" />
            </SelectTrigger>
            <SelectContent>
              {state.goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --------- evaluation (optional) --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Evaluation (optional)</Label>
          <Select
            value={draft.evaluationId ?? "none"}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, evaluationId: v === "none" ? undefined : v }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {state.evaluations.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAdd} className="self-start">
          Add Execution
        </Button>
      </div>
    </div>
  )
}
