"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, BarChart2, Trash2, Play, Info } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getHistory, clearHistory, type HistoryEntry } from "@/lib/local-storage";

type Outcome = HistoryEntry["outcome"];

const OUTCOME_COLORS: Record<Outcome, string> = {
  successful: "var(--success)",
  "no-results": "var(--warning)",
  failed: "var(--error)",
};

const OUTCOME_LABELS: Record<Outcome, string> = {
  successful: "Successful",
  "no-results": "No results",
  failed: "Failed",
};

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<Outcome | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "results">("newest");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  // --------- load from localstorage ---------
  useEffect(() => {
    setEntries(getHistory());
  }, []);

  // --------- filtered + sorted entries ---------
  const filtered = useMemo(() => {
    let list = entries;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.query.toLowerCase().includes(term) ||
          e.cqTitle.toLowerCase().includes(term) ||
          (e.termLabel?.toLowerCase().includes(term) ?? false)
      );
    }
    if (filterOutcome !== "all") {
      list = list.filter((e) => e.outcome === filterOutcome);
    }
    if (sortBy === "oldest") {
      list = [...list].reverse();
    } else if (sortBy === "results") {
      list = [...list].sort((a, b) => b.resultCount - a.resultCount);
    }
    return list;
  }, [entries, searchTerm, filterOutcome, sortBy]);

  // --------- stats ---------
  const stats = useMemo(
    () => ({
      total: entries.length,
      successful: entries.filter((e) => e.outcome === "successful").length,
      noResults: entries.filter((e) => e.outcome === "no-results").length,
      failed: entries.filter((e) => e.outcome === "failed").length,
    }),
    [entries]
  );

  function handleClearHistory() {
    clearHistory();
    setEntries([]);
    toast.success("Query history cleared");
  }

  function handleRerun(entry: HistoryEntry) {
    router.push(`/query?q=${encodeURIComponent(entry.query)}`);
  }

  return (
    <PageShell
      title="Query History"
      subtitle="Review, revisit, and compare your past queries and their outcomes."
    >
      <div className="animate-in fade-in fill-mode-both duration-[400ms]">
        <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-6 items-start">
          {/* --------- left column --------- */}
          <div className="md:sticky md:top-20 flex flex-col gap-4">
            <Card
              className="ring-0 border"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
              }}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                {/* --------- search --------- */}
                <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
                  Search History
                </p>
                <div
                  className="flex items-center gap-2 px-3 rounded-lg"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                >
                  <Search size={13} style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 text-[13px] outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>

                <Separator />

                {/* --------- outcome filter --------- */}
                <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
                  Filter by Outcome
                </p>
                <div className="flex flex-col gap-1">
                  {(["all", "successful", "no-results", "failed"] as const).map((outcome) => {
                    const isActive = filterOutcome === outcome;
                    return (
                      <Button
                        key={outcome}
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterOutcome(outcome)}
                        className="justify-start font-normal"
                        style={
                          isActive
                            ? {
                                borderLeft: "3px solid var(--primary)",
                                borderRadius: "0 6px 6px 0",
                                color: "var(--primary)",
                                backgroundColor: "var(--primary-soft)",
                              }
                            : { borderLeft: "3px solid transparent", borderRadius: "0 6px 6px 0" }
                        }
                      >
                        <span className="flex items-center gap-2">
                          {outcome !== "all" && (
                            <span
                              className="inline-block w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: OUTCOME_COLORS[outcome] }}
                            />
                          )}
                          {outcome === "all" ? "All outcomes" : OUTCOME_LABELS[outcome]}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                <Separator />

                {/* --------- sort --------- */}
                <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
                  Sort by
                </p>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger style={{ borderRadius: "8px" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="results">Most results</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                {/* --------- session stats --------- */}
                <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
                  Session Stats
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Total queries", value: stats.total, color: undefined },
                    { label: "Successful", value: stats.successful, color: "var(--success)" },
                    { label: "No results", value: stats.noResults, color: "var(--warning)" },
                    { label: "Failed", value: stats.failed, color: "var(--error)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span
                        className="font-bold tabular-nums"
                        style={{ color: color ?? "var(--text-primary)" }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --------- right column --------- */}
          <div className="flex flex-col gap-4">
            {/* --------- header row --------- */}
            <div className="flex items-center justify-between">
              <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                Showing{" "}
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "entry" : "entries"}
              </p>

              {entries.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[13px] gap-1.5"
                      style={{ color: "var(--error)" }}
                    >
                      <Trash2 size={14} />
                      Clear history
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear query history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {entries.length} history entries. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory}>
                        Clear history
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* --------- empty state --------- */}
            {filtered.length === 0 && (
              <Card
                className="ring-0 border"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                }}
              >
                <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
                  <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                    No entries found
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    {entries.length === 0
                      ? "Run a query on the Query page to start building your history."
                      : "Try adjusting your search or filter."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* --------- history cards --------- */}
            {filtered.map((entry, index) => (
              <div
                key={entry.id}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  className="ring-0 border cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    backgroundColor:
                      entry.outcome === "failed"
                        ? "color-mix(in srgb, var(--error) 6%, var(--surface))"
                        : "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                  }}
                >
                  <CardContent className="p-5 flex flex-col gap-3">
                    {/* --------- top row --------- */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="text-[14px] font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                          {entry.query}
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                          {entry.cqTitle}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[11px]"
                        style={{
                          borderRadius: "6px",
                          color: OUTCOME_COLORS[entry.outcome],
                          borderColor: OUTCOME_COLORS[entry.outcome],
                        }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: OUTCOME_COLORS[entry.outcome] }}
                        />
                        {OUTCOME_LABELS[entry.outcome]}
                      </Badge>
                    </div>

                    {/* --------- meta row --------- */}
                    <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      {entry.outcome === "successful" && (
                        <span className="flex items-center gap-1">
                          <BarChart2 size={12} />
                          {entry.resultCount} results
                        </span>
                      )}
                    </div>

                    {/* --------- matched term badge --------- */}
                    {entry.termLabel && (
                      <Badge variant="secondary" className="text-[11px] w-fit" style={{ borderRadius: "6px" }}>
                        {entry.termLabel}
                      </Badge>
                    )}

                    {/* --------- action buttons --------- */}
                    <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleRerun(entry)}
                        style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "8px" }}
                      >
                        <Play size={13} />
                        Re-run
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                        style={{ borderRadius: "8px" }}
                      >
                        <Info size={13} />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------- detail dialog --------- */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[15px] leading-snug">{selectedEntry.query}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: OUTCOME_COLORS[selectedEntry.outcome] }}
                    />
                    <span style={{ color: OUTCOME_COLORS[selectedEntry.outcome] }}>
                      {OUTCOME_LABELS[selectedEntry.outcome]}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {formatTimestamp(selectedEntry.timestamp)}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <Separator />

              {/* --------- stats --------- */}
              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { label: "Results", value: selectedEntry.resultCount },
                  { label: "Outcome", value: OUTCOME_LABELS[selectedEntry.outcome] },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-0.5 p-3 rounded-lg"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <span className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                      {value}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* --------- cq info --------- */}
              <div className="flex flex-col gap-1">
                <p className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>
                  Query used
                </p>
                <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                  {selectedEntry.cqTitle}
                </p>
              </div>

              {/* --------- sparql --------- */}
              {selectedEntry.sparql && (
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-muted)" }}>
                    Generated SPARQL
                  </p>
                  <pre
                    className="overflow-x-auto text-[12px] leading-relaxed"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {selectedEntry.sparql}
                  </pre>
                </div>
              )}

              {/* --------- footer actions --------- */}
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  onClick={() => { setSelectedEntry(null); handleRerun(selectedEntry); }}
                  style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "8px" }}
                >
                  <Play size={14} />
                  Re-run this query
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" style={{ borderRadius: "8px" }}>
                    Close
                  </Button>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
