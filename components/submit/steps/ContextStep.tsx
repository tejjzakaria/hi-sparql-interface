"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import { ThesaurusMultiSelect } from "@/components/submit/shared/ThesaurusMultiSelect"
import type { FormState } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------

interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- step two ---------

export function ContextStep({ state, onChange, terms }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* --------- context label --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Context label <span className="text-destructive">*</span>
        </Label>
        <Input
          value={state.contextLabel}
          onChange={(e) => onChange({ contextLabel: e.target.value })}
          placeholder="Describe the context…"
        />
      </div>

      {/* --------- context concept optional --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Context concept{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <ThesaurusSelect
          terms={terms}
          value={state.contextConcept ?? ""}
          onChange={(uri) => onChange({ contextConcept: uri || undefined })}
          placeholder="Select a concept…"
        />
      </div>

      {/* --------- phenomenon concepts --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Phenomenon concepts <span className="text-destructive">*</span>
        </Label>
        <ThesaurusMultiSelect
          terms={terms}
          value={state.phenomenonConcepts}
          onChange={(uris) => onChange({ phenomenonConcepts: uris })}
          placeholder="Select phenomena…"
        />
      </div>

      {/* --------- constraint concepts --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Constraint concepts <span className="text-destructive">*</span>
        </Label>
        <ThesaurusMultiSelect
          terms={terms}
          value={state.constraintConcepts}
          onChange={(uris) => onChange({ constraintConcepts: uris })}
          placeholder="Select constraints…"
        />
      </div>
    </div>
  )
}
