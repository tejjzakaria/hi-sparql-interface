"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ThesaurusSelect } from "@/components/submit/shared/ThesaurusSelect"
import type { FormState } from "@/lib/submission-types"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- step props ---------

interface StepProps {
  state: FormState
  onChange: (p: Partial<FormState>) => void
  terms: ThesaurusTerm[]
}

// --------- step one ---------

export function UseCaseStep({ state, onChange, terms }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* --------- use case title --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Use case title <span className="text-destructive">*</span>
        </Label>
        <Input
          value={state.useCaseLabel}
          onChange={(e) => onChange({ useCaseLabel: e.target.value })}
          placeholder="Enter a title…"
        />
      </div>

      {/* --------- use case concept --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Use case concept <span className="text-destructive">*</span>
        </Label>
        <ThesaurusSelect
          terms={terms}
          value={state.useCaseConcept}
          onChange={(uri) => onChange({ useCaseConcept: uri })}
          placeholder="Select a concept…"
        />
      </div>

      {/* --------- domain concept --------- */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">
          Domain concept <span className="text-destructive">*</span>
        </Label>
        <ThesaurusSelect
          terms={terms}
          value={state.domainConcept}
          onChange={(uri) => onChange({ domainConcept: uri })}
          placeholder="Select a domain…"
        />
      </div>
    </div>
  )
}
