"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  FiArrowRight, FiCheck, FiInfo, FiList, FiSearch,
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CQ_QUERIES } from "@/lib/cq-queries"

// --------- types ---------
type Screen = "intro" | "task" | "questionnaire" | "done"
type Familiarity = "none" | "basic" | "experienced"

// --------- cq hints ---------
const CQ_HINTS: Record<string, { context: string; steps: string[]; examples: string[] }> = {
  "cq1-team-composition": {
    context:
      "You're exploring how a human–AI team is composed for a specific use case — who the agents are and what roles they play.",
    steps: [
      "A default example is already loaded on the right — read through the results",
      "To explore another use case, type one of the example terms below in the search bar",
      "Select the matching concept from the autocomplete dropdown",
      "Result cards show agent types, roles, and role definitions",
    ],
    examples: [
      "Personal Assistant Use Case",
      "Medical Diagnosis Use Case",
      "Autonomous Tutoring Use Case",
      "Energy Negotiation Use Case",
    ],
  },
  "cq2-agent-tasks": {
    context:
      "You're exploring which tasks an agent can perform based on its capabilities, and which use cases it can participate in.",
    steps: [
      "A default example is already loaded — read through the results",
      "To explore another capability, type one of the example terms below in the search bar",
      "Select the capability from the autocomplete dropdown",
      "Results show which tasks that capability enables and which use cases include it",
    ],
    examples: [
      "Bayesian reasoning capability",
      "Clinical judgment capability",
      "Knowledge graph querying capability",
      "Explaining capability",
    ],
  },
  "cq3-team-eligibility": {
    context:
      "You're checking which team compositions satisfy all capability requirements for achieving a given goal.",
    steps: [
      "A default example is already loaded — read through the results",
      "To explore another goal, type one of the example terms below in the search bar",
      "Select the goal from the autocomplete dropdown",
      "Results show teams and agents that collectively cover all required capabilities",
    ],
    examples: [
      "Fair and Accurate Verdict Goal",
      "Effective Learning Goal",
      "Enhanced Visitor Goal",
      "User Wellbeing Goal",
    ],
  },
  "cq5-interactions": {
    context:
      "You're exploring what types of interactions occur between agents during task execution across all scenarios.",
    steps: [
      "The query has already been run — results are shown on the right",
      "Browse the interaction types, intents (e.g. explanation, negotiation), and modalities (e.g. verbal dialogue, text chat)",
      "Use the filter bar above the results to narrow down by keyword",
    ],
    examples: [],
  },
  "cq6-method-goals": {
    context:
      "You're exploring which goals and tasks a specific computational method contributes to.",
    steps: [
      "A default example is already loaded — read through the results",
      "To explore another method, type one of the example terms below in the search bar",
      "Select the method from the autocomplete dropdown",
      "Results show which goals and tasks can be achieved with that method",
    ],
    examples: [
      "Semantic Linking Method",
      "Reinforcement Learning Method",
      "Knowledge Graph Query Method",
      "Post-hoc Explanation Method",
    ],
  },
  "cq7-metric-tasks": {
    context:
      "You're exploring which tasks can be assessed using a given evaluation metric.",
    steps: [
      "A default example is already loaded — read through the results",
      "To explore another metric, type one of the example terms below in the search bar",
      "Select the metric from the autocomplete dropdown",
      "Results show which tasks are evaluated by that metric",
    ],
    examples: [
      "Fair Outcome Metric",
      "Diagnosis Accuracy Metric",
      "Task Success Rate Metric",
      "Explanation Clarity Metric",
    ],
  },
  "cq8-goal-experiments": {
    context:
      "You're exploring which experiments and metrics are associated with a goal, including the hypotheses they address.",
    steps: [
      "The query has already been run with a default goal — results are shown on the right",
      "Browse the experiments, their metrics, and the null and alternative hypotheses",
      "Use the filter bar to search within results",
    ],
    examples: [],
  },
  "cq9-constraint-cases": {
    context:
      "You're exploring which use cases are affected by a given contextual constraint, and how it shapes the team.",
    steps: [
      "A default example is already loaded — read through the results",
      "To explore another constraint, type one of the example terms below in the search bar",
      "Select the constraint from the autocomplete dropdown",
      "Results show affected use cases, team members, and the roles operating under that constraint",
    ],
    examples: [
      "Privacy Constraint",
      "Safety Constraint",
      "Transparency Constraint",
      "Fairness Constraint",
    ],
  },
  "cq10-shared-constraints": {
    context:
      "You're looking for constraints that appear across multiple use cases and which roles they affect.",
    steps: [
      "The query has already been run — results are shown on the right",
      "Browse which constraints are shared across different use cases",
      "Use the filter bar to search within results by constraint name or role",
    ],
    examples: [],
  },
  "cq11-phenomena": {
    context:
      "You're exploring what contextual phenomena (e.g. trust shifts, knowledge mismatches) are associated with a specific use case.",
    steps: [
      "The query has already been run with a default use case — results are shown on the right",
      "Browse the contextual phenomena such as trust shifts, sensor noise, and group-thinking dynamics",
      "Use the filter bar to search within results",
    ],
    examples: [],
  },
}

// --------- questionnaire items ---------
const QUESTIONS = [
  "The interface helped me find concepts that matched what I was looking for. I understood why each result appeared in my search.",
  "The interface's vocabulary matched how I think about these concepts.",
  "The suggestions or questions the interface offered helped me refine my search.",
  "I would use this interface in my actual research.",
]

// --------- likert row ---------
function LikertRow({
  num, question, value, onChange,
}: {
  num: number
  question: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
        <span className="font-semibold">{num}.</span>{" "}{question}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-[11px] shrink-0 w-[7rem]" style={{ color: "var(--text-muted)" }}>
          Strongly disagree
        </span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <Button
              key={v}
              variant="outline"
              size="sm"
              onClick={() => onChange(v)}
              className="w-9 h-9 p-0 text-[13px] font-medium"
              style={
                value === v
                  ? { backgroundColor: "var(--primary)", color: "white", borderColor: "var(--primary)" }
                  : {}
              }
            >
              {v}
            </Button>
          ))}
        </div>
        <span className="text-[11px] shrink-0 w-[7rem] text-right" style={{ color: "var(--text-muted)" }}>
          Strongly agree
        </span>
      </div>
    </div>
  )
}

// --------- main component ---------
export function StudySession() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [name, setName] = useState("")
  const [familiarity, setFamiliarity] = useState<Familiarity | "">("")
  const [assignedCQKey, setAssignedCQKey] = useState<string>("")
  const [startedAt, setStartedAt] = useState<number>(0)
  const [ratings, setRatings] = useState<Record<string, number | null>>({
    q1: null, q2: null, q3: null, q4: null,
  })
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // --------- start session ---------
  function handleStart() {
    if (!name.trim() || !familiarity) return
    const keys = Object.keys(CQ_QUERIES)
    const picked = keys[Math.floor(Math.random() * keys.length)]
    setAssignedCQKey(picked)
    setStartedAt(Date.now())
    setScreen("task")
  }

  // --------- submit questionnaire ---------
  async function handleSubmit() {
    if (Object.values(ratings).some((v) => v === null)) {
      toast.error("Please rate all four statements before submitting.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/study/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_name: name.trim(),
          sparql_familiarity: familiarity,
          cq_id: assignedCQKey,
          q1: ratings.q1,
          q2: ratings.q2,
          q3: ratings.q3,
          q4: ratings.q4,
          q5_comments: comments.trim() || null,
          started_at: startedAt,
        }),
      })
      if (res.ok) {
        setScreen("done")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to save response")
      }
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  const cq = assignedCQKey ? CQ_QUERIES[assignedCQKey] : null
  const hints = assignedCQKey ? CQ_HINTS[assignedCQKey] : null

  // --------- intro screen ---------
  if (screen === "intro") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <Badge
              variant="outline"
              className="w-fit mb-2 text-[11px]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Study Session
            </Badge>
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription className="text-[13px]">
              You will be given one research question to explore using the
              interface, then a short questionnaire.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* --------- name ---------  */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-[13px]">Your name</Label>
              <Input
                id="name"
                placeholder="e.g. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* --------- sparql familiarity ---------  */}
            <div className="flex flex-col gap-2">
              <Label className="text-[13px]">SPARQL familiarity</Label>
              <ToggleGroup
                type="single"
                value={familiarity}
                onValueChange={(v) => v && setFamiliarity(v as Familiarity)}
                variant="outline"
                spacing={1}
                className="w-full justify-start"
              >
                <ToggleGroupItem value="none" className="text-[13px] flex-1">None</ToggleGroupItem>
                <ToggleGroupItem value="basic" className="text-[13px] flex-1">Basic</ToggleGroupItem>
                <ToggleGroupItem value="experienced" className="text-[13px] flex-1">Experienced</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button
              onClick={handleStart}
              disabled={!name.trim() || !familiarity}
              className="gap-2 mt-1"
              style={{ backgroundColor: "var(--primary)", color: "white" }}
            >
              Start session
              <FiArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --------- task screen ---------
  if (screen === "task" && cq && hints) {
    const cqNum = assignedCQKey.match(/cq(\d+)/)?.[1] ?? "?"

    return (
      <div
        className="flex flex-col overflow-hidden"
        style={{ height: "100dvh", backgroundColor: "var(--background)" }}
      >
        {/* --------- top bar --------- */}
        <div
          className="flex items-center justify-between px-4 h-12 shrink-0 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              HI Query
            </span>
            <span style={{ color: "var(--border)" }}>·</span>
            <Badge
              variant="outline"
              className="text-[11px]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Study Session
            </Badge>
          </div>

          <Button
            size="sm"
            className="gap-1.5 text-[12px]"
            onClick={() => setScreen("questionnaire")}
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            <FiCheck size={13} />
            I&apos;ve answered this question
          </Button>
        </div>

        {/* --------- body --------- */}
        <div className="flex flex-1 overflow-hidden">
          {/* --------- guidance panel --------- */}
          <aside
            className="flex flex-col gap-4 p-5 overflow-y-auto shrink-0"
            style={{
              width: "320px",
              borderRight: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            {/* --------- cq badge + title --------- */}
            <div className="flex flex-col gap-2">
              <Badge
                variant="outline"
                className="w-fit text-[11px] font-mono"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                CQ{cqNum}
              </Badge>
              <h2 className="text-[14px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                {cq.title}
              </h2>
              <p className="text-[12px] italic leading-relaxed" style={{ color: "var(--text-muted)" }}>
                &ldquo;{cq.description}&rdquo;
              </p>
            </div>

            <Separator />

            {/* --------- context --------- */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <FiInfo size={12} style={{ color: "var(--primary)" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                  What you&apos;re exploring
                </span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {hints.context}
              </p>
            </div>

            <Separator />

            {/* --------- steps --------- */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <FiList size={12} style={{ color: "var(--primary)" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                  How to use the interface
                </span>
              </div>

              <ol className="flex flex-col gap-2.5">
                {hints.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--primary)", color: "white" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {hints.examples.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <FiSearch size={12} style={{ color: "var(--primary)" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                      Try searching for
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hints.examples.map((ex) => (
                      <Badge
                        key={ex}
                        variant="outline"
                        className="text-[11px] cursor-default select-all"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {ex}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Type any of these exactly in the search bar on the right.
                  </p>
                </div>
              </>
            )}

            <Separator />

            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Take as long as you need. When you feel you have answered the
              question, click the button in the top-right corner.
            </p>
          </aside>

          {/* --------- interface iframe --------- */}
          <iframe
            src={`/query?cq=${assignedCQKey}`}
            className="flex-1 border-0"
            style={{ height: "100%" }}
            title="HI Query Interface"
          />
        </div>
      </div>
    )
  }

  // --------- questionnaire screen ---------
  if (screen === "questionnaire") {
    const allRated = Object.values(ratings).every((v) => v !== null)

    return (
      <div
        className="min-h-screen py-12 px-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="mx-auto max-w-2xl flex flex-col gap-6">
          {/* --------- header --------- */}
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className="w-fit text-[11px]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Post-Session Questionnaire
            </Badge>
            <h1 className="text-xl font-semibold mt-2" style={{ color: "var(--text-primary)" }}>
              How did it go?
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Rate each statement from 1 (strongly disagree) to 5 (strongly agree).
            </p>
          </div>

          <Separator />

          {/* --------- likert items --------- */}
          <div className="flex flex-col gap-7">
            {QUESTIONS.map((q, i) => {
              const key = `q${i + 1}` as keyof typeof ratings
              return (
                <LikertRow
                  key={i}
                  num={i + 1}
                  question={q}
                  value={ratings[key]}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                />
              )
            })}
          </div>

          <Separator />

          {/* --------- free text --------- */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="comments" className="text-[13px]">
              5. Anything else you&apos;d like to add? <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </Label>
            <Textarea
              id="comments"
              placeholder="Your thoughts…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* --------- submit --------- */}
          <Button
            onClick={handleSubmit}
            disabled={!allRated || submitting}
            className="gap-2 self-end"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            {submitting ? "Saving…" : "Submit"}
            {!submitting && <FiCheck size={14} />}
          </Button>
        </div>
      </div>
    )
  }

  // --------- done screen ---------
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
        >
          <FiCheck size={22} style={{ color: "var(--primary)" }} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Thank you
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Your response has been recorded. You can close this tab.
        </p>
      </div>
    </div>
  )
}
