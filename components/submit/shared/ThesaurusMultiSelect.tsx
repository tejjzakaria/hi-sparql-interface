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
import { Badge } from "@/components/ui/badge"
import type { ThesaurusTerm } from "@/lib/graphdb"

// --------- multi-value combobox ---------

interface ThesaurusMultiSelectProps {
  terms: ThesaurusTerm[]
  value: string[]
  onChange: (uris: string[]) => void
  placeholder?: string
  className?: string
}

export function ThesaurusMultiSelect({
  terms,
  value,
  onChange,
  placeholder = "Select terms…",
  className,
}: ThesaurusMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined)

  // --------- measure trigger width ---------
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  function handleToggle(uri: string) {
    if (value.includes(uri)) {
      onChange(value.filter((v) => v !== uri))
    } else {
      onChange([...value, uri])
    }
  }

  // --------- selected term objects ---------
  const selectedTerms = value
    .map((uri) => terms.find((t) => t.uri === uri))
    .filter((t): t is ThesaurusTerm => t !== undefined)

  const visibleBadges = selectedTerms.slice(0, 2)
  const overflowCount = selectedTerms.length - 2

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-8 py-1", className)}
        >
          <span className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
            {selectedTerms.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visibleBadges.map((term) => (
                  <Badge key={term.uri} variant="secondary" className="truncate max-w-[120px]">
                    {term.label}
                  </Badge>
                ))}
                {overflowCount > 0 && (
                  <Badge variant="outline">+{overflowCount} more</Badge>
                )}
              </>
            )}
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
                const isSelected = value.includes(term.uri)
                return (
                  <CommandItem
                    key={term.uri}
                    value={term.label}
                    data-checked={isSelected}
                    onSelect={() => handleToggle(term.uri)}
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
