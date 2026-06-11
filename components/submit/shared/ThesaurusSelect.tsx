"use client"

import * as React from "react"
import { FiChevronDown, FiCheck } from "react-icons/fi"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- single-value combobox ---------

interface ThesaurusSelectProps {
  terms: ThesaurusTerm[]
  value: string
  onChange: (uri: string) => void
  placeholder?: string
  className?: string
}

export function ThesaurusSelect({
  terms,
  value,
  onChange,
  placeholder = "Select a term…",
  className,
}: ThesaurusSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined)

  // --------- measure trigger width ---------
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const selected = terms.find((t) => t.uri === value)

  function handleSelect(uri: string) {
    if (uri === value) {
      onChange("")
    } else {
      onChange(uri)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <FiChevronDown className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0"
        style={{ width: triggerWidth ? `${triggerWidth}px` : undefined }}
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {terms.map((term) => {
                const isSelected = term.uri === value
                return (
                  <CommandItem
                    key={term.uri}
                    value={term.label}
                    data-checked={isSelected}
                    onSelect={() => handleSelect(term.uri)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{term.label}</span>
                    {isSelected && <FiCheck className="ml-2 shrink-0" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
