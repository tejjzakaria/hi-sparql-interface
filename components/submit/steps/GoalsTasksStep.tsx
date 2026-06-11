"use client"

import * as React from "react"
import { FiTrash2 } from "react-icons/fi"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import type { FormState, FormGoal, FormTask, FormCapability } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------

interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- task draft ---------

interface TaskDraft {
  label: string
  concept: string
  requiredCapabilityIds: string[]
}

// --------- goal draft ---------

interface GoalDraft {
  label: string
  concept: string
  tasks: FormTask[]
}

function blankTaskDraft(): TaskDraft {
  return { label: "", concept: "", requiredCapabilityIds: [] }
}

function blankGoalDraft(): GoalDraft {
  return { label: "", concept: "", tasks: [] }
}

// --------- capability multi-select row ---------

interface CapabilityMultiSelectProps {
  allCapabilities: FormCapability[]
  value: string[]
  onChange: (ids: string[]) => void
}

function CapabilityMultiSelect({
  allCapabilities,
  value,
  onChange,
}: CapabilityMultiSelectProps) {
  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  if (allCapabilities.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No capabilities yet — add agents first.
      </p>
    )
  }

  return (
    // --------- checkbox list ---------
    <ul className="flex flex-col gap-1">
      {allCapabilities.map((cap) => {
        const checked = value.includes(cap.id)
        return (
          <li key={cap.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`cap-${cap.id}`}
              checked={checked}
              onChange={() => toggle(cap.id)}
              className="accent-primary"
            />
            <label
              htmlFor={`cap-${cap.id}`}
              className="text-[13px] cursor-pointer select-none"
            >
              {cap.label}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

// --------- step four ---------

export function GoalsTasksStep({ state, onChange, terms }: StepProps) {
  const [goalDraft, setGoalDraft] = React.useState<GoalDraft>(blankGoalDraft)
  const [taskDraft, setTaskDraft] = React.useState<TaskDraft>(blankTaskDraft)

  // --------- all capabilities flat ---------
  const allCapabilities: FormCapability[] = state.agents.flatMap((a) => a.capabilities)

  // --------- term label lookup ---------
  function termLabel(uri: string): string {
    return terms.find((t) => t.uri === uri)?.label ?? uri
  }

  // --------- remove goal ---------
  function handleRemoveGoal(id: string) {
    onChange({ goals: state.goals.filter((g) => g.id !== id) })
    toast.success("Goal removed.")
  }

  // --------- add task to draft ---------
  function handleAddTask() {
    if (!taskDraft.label.trim()) {
      toast.error("Task label is required.")
      return
    }
    if (!taskDraft.concept) {
      toast.error("Task concept is required.")
      return
    }
    const task: FormTask = {
      id: crypto.randomUUID(),
      label: taskDraft.label.trim(),
      concept: taskDraft.concept,
      requiredCapabilityIds: taskDraft.requiredCapabilityIds,
    }
    setGoalDraft((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
    setTaskDraft(blankTaskDraft)
  }

  // --------- remove task from draft ---------
  function handleRemoveTaskDraft(taskId: string) {
    setGoalDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }))
  }

  // --------- add goal ---------
  function handleAddGoal() {
    if (!goalDraft.label.trim()) {
      toast.error("Goal label is required.")
      return
    }
    if (!goalDraft.concept) {
      toast.error("Goal concept is required.")
      return
    }
    const goal: FormGoal = {
      id: crypto.randomUUID(),
      label: goalDraft.label.trim(),
      concept: goalDraft.concept,
      tasks: goalDraft.tasks,
    }
    onChange({ goals: [...state.goals, goal] })
    setGoalDraft(blankGoalDraft)
    setTaskDraft(blankTaskDraft)
    toast.success("Goal added.")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------- existing goals list --------- */}
      {state.goals.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.goals.map((goal) => (
            <Card key={goal.id} size="sm">
              <CardHeader>
                <CardTitle>
                  <span>{goal.label}</span>
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    — {termLabel(goal.concept)}
                  </span>
                </CardTitle>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveGoal(goal.id)}
                    aria-label="Remove goal"
                  >
                    <FiTrash2 />
                  </Button>
                </CardAction>
              </CardHeader>
              {goal.tasks.length > 0 && (
                <CardContent>
                  <ul className="flex flex-col gap-1">
                    {goal.tasks.map((task) => (
                      <li key={task.id} className="text-[13px] text-muted-foreground">
                        {task.label}{" "}
                        <span className="text-xs opacity-60">
                          — {termLabel(task.concept)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* --------- add goal form --------- */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Add goal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* --------- goal label --------- */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">
              Goal label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={goalDraft.label}
              onChange={(e) =>
                setGoalDraft((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="e.g. Improve accuracy"
            />
          </div>

          {/* --------- goal concept --------- */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">
              Goal concept <span className="text-destructive">*</span>
            </Label>
            <ThesaurusSelect
              terms={terms}
              value={goalDraft.concept}
              onChange={(uri) => setGoalDraft((prev) => ({ ...prev, concept: uri }))}
              placeholder="Select a concept…"
            />
          </div>

          {/* --------- tasks sub-section --------- */}
          <div className="flex flex-col gap-2">
            <Label className="text-[13px]">Tasks</Label>

            {/* --------- draft task list --------- */}
            {goalDraft.tasks.length > 0 && (
              <ul className="flex flex-col gap-1 mb-1">
                {goalDraft.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-[13px]"
                  >
                    <span>
                      {task.label}{" "}
                      <span className="text-xs text-muted-foreground">
                        — {termLabel(task.concept)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTaskDraft(task.id)}
                      aria-label="Remove task"
                    >
                      <FiTrash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* --------- add task row --------- */}
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Task label</Label>
                <Input
                  value={taskDraft.label}
                  onChange={(e) =>
                    setTaskDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g. Label training samples"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Task concept</Label>
                <ThesaurusSelect
                  terms={terms}
                  value={taskDraft.concept}
                  onChange={(uri) =>
                    setTaskDraft((prev) => ({ ...prev, concept: uri }))
                  }
                  placeholder="Select a concept…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Required capabilities</Label>
                <CapabilityMultiSelect
                  allCapabilities={allCapabilities}
                  value={taskDraft.requiredCapabilityIds}
                  onChange={(ids) =>
                    setTaskDraft((prev) => ({ ...prev, requiredCapabilityIds: ids }))
                  }
                />
              </div>

              <Button variant="secondary" size="sm" onClick={handleAddTask}>
                Add task
              </Button>
            </div>
          </div>

          {/* --------- submit goal --------- */}
          <Button onClick={handleAddGoal}>Add Goal</Button>
        </CardContent>
      </Card>
    </div>
  )
}
