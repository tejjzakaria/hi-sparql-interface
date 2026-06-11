"use client"

import * as React from "react"
import { toast } from "sonner"
import { FiTrash2 } from "react-icons/fi"
import { Button } from "@/components/ui/button"
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
import type { FormState, FormInteraction } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------
interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- blank draft ---------
interface InteractionDraft {
  agentIds: string[]
  intentConcept: string
  modalityConcept: string
  executionId: string | undefined
}

function blankDraft(): InteractionDraft {
  return {
    agentIds: [],
    intentConcept: "",
    modalityConcept: "",
    executionId: undefined,
  }
}

export function InteractionsStep({ state, onChange, terms }: StepProps) {
  const [draft, setDraft] = React.useState<InteractionDraft>(blankDraft())

  function termLabel(uri: string) {
    return terms.find((t) => t.uri === uri)?.label ?? uri
  }

  function agentLabel(id: string) {
    return state.agents.find((a) => a.id === id)?.label ?? id
  }

  function toggleAgent(id: string) {
    setDraft((d) => {
      const already = d.agentIds.includes(id)
      return {
        ...d,
        agentIds: already ? d.agentIds.filter((x) => x !== id) : [...d.agentIds, id],
      }
    })
  }

  function handleAdd() {
    if (draft.agentIds.length < 2) {
      toast.error("Select at least 2 agents for an interaction.")
      return
    }
    if (!draft.intentConcept) {
      toast.error("Please select an intent concept.")
      return
    }
    if (!draft.modalityConcept) {
      toast.error("Please select a modality concept.")
      return
    }

    const next: FormInteraction = {
      id: crypto.randomUUID(),
      agentIds: draft.agentIds,
      intentConcept: draft.intentConcept,
      modalityConcept: draft.modalityConcept,
      executionId: draft.executionId,
    }
    onChange({ interactions: [...state.interactions, next] })
    setDraft(blankDraft())
    toast.success("Interaction added.")
  }

  function handleRemove(id: string) {
    onChange({ interactions: state.interactions.filter((i) => i.id !== id) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------- optional note --------- */}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Interactions are optional. Skip if your scenario has no multi-agent interaction episodes.
      </p>

      {/* --------- existing interactions --------- */}
      {state.interactions.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.interactions.map((interaction) => (
            <Card key={interaction.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Interaction</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(interaction.id)}
                    aria-label="remove interaction"
                  >
                    <FiTrash2 />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
                <span>Agents: {interaction.agentIds.map(agentLabel).join(", ")}</span>
                <span>Intent: {termLabel(interaction.intentConcept)}</span>
                <span>Modality: {termLabel(interaction.modalityConcept)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* --------- add form --------- */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Add Interaction
        </p>

        {/* --------- agent checkbox list --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Agents (select at least 2)</Label>
          <div className="flex flex-col gap-2 rounded-lg border border-input p-3">
            {state.agents.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No agents defined yet.
              </p>
            )}
            {state.agents.map((agent) => {
              const checked = draft.agentIds.includes(agent.id)
              return (
                <label
                  key={agent.id}
                  className="flex cursor-pointer items-center gap-2 text-sm select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAgent(agent.id)}
                    className="h-4 w-4 rounded border-input accent-[var(--primary)]"
                  />
                  <span>
                    {agent.label}{" "}
                    <span style={{ color: "var(--text-muted)" }}>({agent.type})</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* --------- intent concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Intent concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.intentConcept}
            onChange={(uri) => setDraft((d) => ({ ...d, intentConcept: uri }))}
            placeholder="Select intent…"
          />
        </div>

        {/* --------- modality concept --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Modality concept</Label>
          <ThesaurusSelect
            terms={terms}
            value={draft.modalityConcept}
            onChange={(uri) => setDraft((d) => ({ ...d, modalityConcept: uri }))}
            placeholder="Select modality…"
          />
        </div>

        {/* --------- execution (optional) --------- */}
        <div className="flex flex-col gap-1.5">
          <Label>Execution (optional)</Label>
          <Select
            value={draft.executionId ?? "none"}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, executionId: v === "none" ? undefined : v }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {state.executions.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAdd} className="self-start">
          Add Interaction
        </Button>
      </div>
    </div>
  )
}
