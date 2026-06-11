"use client"

import * as React from "react"
import { FiTrash2 } from "react-icons/fi"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import type { FormState, FormAgent, FormCapability } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------

interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- blank agent form ---------

interface AgentDraft {
  type: "human" | "artificial"
  label: string
  roleConcept: string
  capabilities: FormCapability[]
}

interface CapabilityDraft {
  label: string
  concept: string
}

function blankAgentDraft(): AgentDraft {
  return { type: "human", label: "", roleConcept: "", capabilities: [] }
}

function blankCapDraft(): CapabilityDraft {
  return { label: "", concept: "" }
}

// --------- step three ---------

export function AgentsStep({ state, onChange, terms }: StepProps) {
  const [draft, setDraft] = React.useState<AgentDraft>(blankAgentDraft)
  const [capDraft, setCapDraft] = React.useState<CapabilityDraft>(blankCapDraft)

  // --------- remove agent ---------
  function handleRemoveAgent(id: string) {
    onChange({ agents: state.agents.filter((a) => a.id !== id) })
    toast.success("Agent removed.")
  }

  // --------- remove capability draft ---------
  function handleRemoveCapDraft(capId: string) {
    setDraft((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c.id !== capId),
    }))
  }

  // --------- add capability to draft ---------
  function handleAddCapability() {
    if (!capDraft.label.trim()) {
      toast.error("Capability label is required.")
      return
    }
    if (!capDraft.concept) {
      toast.error("Capability concept is required.")
      return
    }
    const cap: FormCapability = {
      id: crypto.randomUUID(),
      label: capDraft.label.trim(),
      concept: capDraft.concept,
    }
    setDraft((prev) => ({ ...prev, capabilities: [...prev.capabilities, cap] }))
    setCapDraft(blankCapDraft)
  }

  // --------- add agent ---------
  function handleAddAgent() {
    if (!draft.label.trim()) {
      toast.error("Agent label is required.")
      return
    }
    if (!draft.roleConcept) {
      toast.error("Role concept is required.")
      return
    }
    const agent: FormAgent = {
      id: crypto.randomUUID(),
      type: draft.type,
      label: draft.label.trim(),
      roleConcept: draft.roleConcept,
      capabilities: draft.capabilities,
    }
    onChange({ agents: [...state.agents, agent] })
    setDraft(blankAgentDraft)
    setCapDraft(blankCapDraft)
    toast.success("Agent added.")
  }

  // --------- term label lookup ---------
  function termLabel(uri: string): string {
    return terms.find((t) => t.uri === uri)?.label ?? uri
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------- existing agents list --------- */}
      {state.agents.length > 0 && (
        <div className="flex flex-col gap-3">
          {state.agents.map((agent) => (
            <Card key={agent.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{agent.label}</span>
                  <Badge variant="secondary">
                    {agent.type === "human" ? "Human" : "Artificial"}
                  </Badge>
                </CardTitle>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAgent(agent.id)}
                    aria-label="Remove agent"
                  >
                    <FiTrash2 />
                  </Button>
                </CardAction>
              </CardHeader>
              {agent.capabilities.length > 0 && (
                <CardContent>
                  <ul className="flex flex-col gap-1">
                    {agent.capabilities.map((cap) => (
                      <li key={cap.id} className="text-[13px] text-muted-foreground">
                        {cap.label}{" "}
                        <span className="text-xs opacity-60">
                          — {termLabel(cap.concept)}
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

      {/* --------- add agent form --------- */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Add agent</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* --------- agent type --------- */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">
              Agent type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={draft.type}
              onValueChange={(v) =>
                setDraft((prev) => ({ ...prev, type: v as "human" | "artificial" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="human">Human agent</SelectItem>
                  <SelectItem value="artificial">Artificial agent</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* --------- agent label --------- */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">
              Agent label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={draft.label}
              onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="e.g. Domain expert"
            />
          </div>

          {/* --------- role concept --------- */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px]">
              Role concept <span className="text-destructive">*</span>
            </Label>
            <ThesaurusSelect
              terms={terms}
              value={draft.roleConcept}
              onChange={(uri) => setDraft((prev) => ({ ...prev, roleConcept: uri }))}
              placeholder="Select a role…"
            />
          </div>

          {/* --------- capabilities --------- */}
          <div className="flex flex-col gap-2">
            <Label className="text-[13px]">Capabilities</Label>

            {/* --------- draft cap list --------- */}
            {draft.capabilities.length > 0 && (
              <ul className="flex flex-col gap-1 mb-1">
                {draft.capabilities.map((cap) => (
                  <li
                    key={cap.id}
                    className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-[13px]"
                  >
                    <span>
                      {cap.label}{" "}
                      <span className="text-xs text-muted-foreground">
                        — {termLabel(cap.concept)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCapDraft(cap.id)}
                      aria-label="Remove capability"
                    >
                      <FiTrash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* --------- add capability row --------- */}
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Capability label</Label>
                <Input
                  value={capDraft.label}
                  onChange={(e) =>
                    setCapDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="e.g. Data annotation"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Capability concept</Label>
                <ThesaurusSelect
                  terms={terms}
                  value={capDraft.concept}
                  onChange={(uri) => setCapDraft((prev) => ({ ...prev, concept: uri }))}
                  placeholder="Select a concept…"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddCapability}>
                Add capability
              </Button>
            </div>
          </div>

          {/* --------- submit agent --------- */}
          <Button onClick={handleAddAgent}>Add Agent</Button>
        </CardContent>
      </Card>
    </div>
  )
}
