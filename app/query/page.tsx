"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search, X, Code, ChevronDown, Loader, ThumbsDown, Play,
  LayoutList, LayoutGrid,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { CATEGORY_TO_CQS } from "@/lib/cq-queries";
import {
  addToHistory,
  getFlaggedKeys,
  toggleFlag,
  makeFlagKey,
} from "@/lib/local-storage";

// --------- types ---------
type ThesaurusTerm = {
  uri: string;
  label: string;
  definition: string;
  broader: string | null;
  broaderLabel: string | null;
};

type SparqlBinding = Record<string, { type: string; value: string }>;

type QueryResult = {
  name: string;
  title: string;
  description: string;
  sparql: string;
  results: {
    head: { vars: string[] };
    results: { bindings: SparqlBinding[] };
  };
};

type CQMeta = {
  name: string;
  title: string;
  description: string;
  paramCategory: string | null;
  paramName: string | null;
};

// --------- category detection ---------
function getCategory(broaderUri: string | null): string {
  if (!broaderUri) return "Other";
  const local = broaderUri.split("/").pop() ?? "";
  if (local === "UseCase") return "Use Case";
  if (local.endsWith("Capability") || local === "Capability") return "Capability";
  if (local === "Goal") return "Goal";
  if (local.endsWith("Constraint") || local === "Constraint") return "Constraint";
  if (local === "Method") return "Method";
  if (local === "Metric") return "Metric";
  if (local === "Role") return "Role";
  if (local === "Task") return "Task";
  if (local === "Phenomenon" || local.endsWith("Phenomenon")) return "Phenomenon";
  return "Other";
}


function QueryPageContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [showSparql, setShowSparql] = useState(false);
  const [editableSparql, setEditableSparql] = useState("");
  const [allTerms, setAllTerms] = useState<ThesaurusTerm[]>([]);
  const [suggestions, setSuggestions] = useState<ThesaurusTerm[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [disambiguationTerms, setDisambiguationTerms] = useState<ThesaurusTerm[]>([]);
  const [availableCQs, setAvailableCQs] = useState<CQMeta[]>([]);
  const [selectedCQ, setSelectedCQ] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [flaggedKeys, setFlaggedKeys] = useState<Set<string>>(new Set());
  const suggestionsRef = useRef<HTMLDivElement>(null); // kept for click-outside on mobile

  useEffect(() => { setFlaggedKeys(getFlaggedKeys()); }, []);

  useEffect(() => {
    fetch("/api/sparql/thesaurus")
      .then((r) => r.json())
      .then((data) => { if (data.terms) setAllTerms(data.terms); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/sparql/queries")
      .then((r) => r.json())
      .then((data) => { if (data.queries) setAvailableCQs(data.queries); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    const decoded = decodeURIComponent(q);
    setQuery(decoded);
    executeTextQuery(decoded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const autoRunDoneRef = useRef(false);
  useEffect(() => {
    const cqParam = searchParams.get("cq");
    if (!cqParam || availableCQs.length === 0 || autoRunDoneRef.current) return;
    const cqMeta = availableCQs.find((c) => c.name === cqParam);
    if (!cqMeta) return;
    autoRunDoneRef.current = true;
    setSelectedCQ(cqMeta.name);
    setShowCQPanel(true);
    runCQ(cqMeta.name, undefined, undefined, cqMeta.title, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, availableCQs]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const lower = query.toLowerCase();
    const matches = allTerms.filter((t) => t.label.toLowerCase().includes(lower)).slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [query, allTerms]);


  // --------- unused param needed by autorun effect ---------
  const [, setShowCQPanel] = useState(false);

  function matchTermToQuery(text: string): ThesaurusTerm | null {
    const lower = text.toLowerCase();
    return (
      allTerms.find((t) => t.label.toLowerCase() === lower) ??
      allTerms.find((t) => t.label.toLowerCase().includes(lower)) ??
      null
    );
  }

  async function runCQ(
    cqName: string,
    termUri?: string,
    paramName?: string | null,
    queryText?: string,
    termLabel?: string | null,
  ) {
    setIsLoading(true);
    setQueryResult(null);
    setShowSuggestions(false);
    setSelectedCQ(cqName);
    setResultFilter("");

    const url =
      termUri && paramName
        ? `/api/sparql/queries/${cqName}?${paramName}=${encodeURIComponent(termUri)}`
        : `/api/sparql/queries/${cqName}`;

    try {
      const res = await fetch(url);
      const data = (await res.json()) as QueryResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Query failed");

      setQueryResult(data);
      setEditableSparql(data.sparql);
      setShowSparql(false);

      const count = data.results?.results?.bindings?.length ?? 0;
      const outcome = count > 0 ? "successful" : "no-results";

      addToHistory({
        query: queryText ?? cqName,
        outcome,
        resultCount: count,
        cqName,
        cqTitle: data.title,
        termLabel: termLabel ?? null,
        sparql: data.sparql,
      });

      if (outcome === "successful") {
        toast.success(`${count} result${count !== 1 ? "s" : ""} found`);
      } else {
        toast.info("Query ran but returned no results");
      }
    } catch (err) {
      addToHistory({
        query: queryText ?? cqName,
        outcome: "failed",
        resultCount: 0,
        cqName,
        cqTitle: availableCQs.find((c) => c.name === cqName)?.title ?? cqName,
        termLabel: termLabel ?? null,
        sparql: "",
      });
      toast.error(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  function pickCQ(cqNames: string[]): string {
    if (selectedCQ && cqNames.includes(selectedCQ)) return selectedCQ;
    return cqNames[0];
  }

  function executeTextQuery(text: string) {
    const matched = matchTermToQuery(text);

    if (!matched) {
      const lower = text.toLowerCase();
      const fuzzy = allTerms
        .filter((t) => {
          const words = lower.split(/\s+/);
          return words.some((w) => w.length > 2 && t.label.toLowerCase().includes(w));
        })
        .slice(0, 6);
      setDisambiguationTerms(fuzzy);
      if (fuzzy.length > 0) {
        toast.info("No exact match — showing related concepts");
      } else {
        toast.error("No matching concept found in the ontology");
      }
      setIsLoading(false);
      return;
    }

    const category = getCategory(matched.broader);
    const cqNames = CATEGORY_TO_CQS[category] ?? [];

    if (cqNames.length === 0) {
      toast.error(`No query defined for category: ${category}`);
      setIsLoading(false);
      return;
    }

    const chosen = pickCQ(cqNames);
    const cqMeta = availableCQs.find((c) => c.name === chosen);
    runCQ(chosen, matched.uri, cqMeta?.paramName ?? null, text, matched.label);
  }

  function handleRunQuery() {
    if (!query.trim()) return;
    setIsLoading(true);
    setDisambiguationTerms([]);
    executeTextQuery(query);
  }

  function handleSelectSuggestion(term: ThesaurusTerm) {
    setQuery(term.label);
    setShowSuggestions(false);
    setIsLoading(true);
    setDisambiguationTerms([]);
    const category = getCategory(term.broader);
    const cqNames = CATEGORY_TO_CQS[category] ?? [];
    if (cqNames.length === 0) {
      toast.error(`No query defined for category: ${category}`);
      setIsLoading(false);
      return;
    }
    const chosen = pickCQ(cqNames);
    const cqMeta = availableCQs.find((c) => c.name === chosen);
    runCQ(chosen, term.uri, cqMeta?.paramName ?? null, term.label, term.label);
  }

  function handleClear() {
    setQuery("");
    setIsLoading(false);
    setQueryResult(null);
    setShowSparql(false);
    setEditableSparql("");
    setSuggestions([]);
    setShowSuggestions(false);
    setDisambiguationTerms([]);
    setSelectedCQ(null);
    setResultFilter("");
    setViewMode("list");
  }

  async function runCustomSparql() {
    if (!editableSparql.trim()) return;
    setIsLoading(true);
    setQueryResult(null);
    setResultFilter("");
    try {
      const res = await fetch("/api/sparql/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sparql: editableSparql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      const syntheticResult: QueryResult = {
        name: "custom",
        title: "Custom SPARQL",
        description: "Results from edited query",
        sparql: editableSparql,
        results: data.results,
      };
      setQueryResult(syntheticResult);
      const count = data.results?.results?.bindings?.length ?? 0;
      if (count > 0) {
        toast.success(`${count} result${count !== 1 ? "s" : ""} found`);
      } else {
        toast.info("Query ran but returned no results");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleFlagResult(index: number) {
    if (!queryResult) return;
    const key = makeFlagKey(queryResult.name, index);
    const isNowFlagged = toggleFlag(key);
    setFlaggedKeys(getFlaggedKeys());
    if (isNowFlagged) {
      toast.error("Result flagged as irrelevant");
    } else {
      toast.success("Flag removed");
    }
  }

  function handleCQClick(cq: CQMeta) {
    setSelectedCQ(cq.name);
    runCQ(cq.name, undefined, undefined, cq.title, null);
  }

  const vars = queryResult?.results?.head?.vars ?? [];
  const allBindings = queryResult?.results?.results?.bindings ?? [];
  const bindings = resultFilter.trim()
    ? allBindings.filter((b) =>
        Object.values(b).some((cell) =>
          cell.value.toLowerCase().includes(resultFilter.toLowerCase())
        )
      )
    : allBindings;

  const hasResults = !!queryResult;

  return (
    <PageShell
      title="Query the Knowledge Graph"
      subtitle="Search for any concept from the Hybrid Intelligence ontology to explore how it connects to use cases, agents, goals, and constraints."
    >
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[400ms]">

        {/* --------- query bar --------- */}
        <div ref={suggestionsRef} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Your Query
            </label>
            {query && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-[12px] hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <Textarea
            placeholder="e.g. Privacy Constraint, Bayesian Reasoning, Medical Diagnosis…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRunQuery(); }
            }}
            className="min-h-[90px] resize-none text-[15px]"
            style={{ borderColor: "var(--border)", borderRadius: "10px" }}
          />

          {/* --------- inline suggestions --------- */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((term) => (
                  <button
                    key={term.uri}
                    onMouseDown={() => handleSelectSuggestion(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {term.label}
                    <Badge variant="secondary" className="text-[10px]" style={{ borderRadius: "4px" }}>
                      {getCategory(term.broader)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleRunQuery}
            disabled={isLoading || !query.trim()}
            className="self-end"
            style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "8px" }}
          >
            {isLoading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
            Run Query
          </Button>
        </div>

        {/* --------- disambiguation --------- */}
        {disambiguationTerms.length > 0 && (
          <Card className="ring-0" style={{ borderColor: "var(--border)", borderRadius: "12px" }}>
            <CardContent className="p-5 flex flex-col gap-3">
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                No exact match — did you mean one of these?
              </p>
              <div className="flex flex-wrap gap-2">
                {disambiguationTerms.map((term) => (
                  <Badge
                    key={term.uri}
                    variant="outline"
                    className="cursor-pointer hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition-colors text-[13px] py-1 px-3"
                    style={{ borderRadius: "8px" }}
                    onClick={() => handleSelectSuggestion(term)}
                  >
                    {term.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* --------- loading --------- */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--text-muted)" }}>
              <Loader size={15} className="animate-spin" />
              Searching the knowledge graph…
            </div>
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
        )}

        {/* --------- results --------- */}
        {!isLoading && hasResults && (
          <div className="flex flex-col gap-4">
            {/* --------- results header --------- */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-bold flex-1" style={{ color: "var(--text-primary)" }}>
                  {queryResult.title}
                </h2>
                <Badge variant="secondary" style={{ borderRadius: "6px" }}>
                  {bindings.length}{bindings.length !== allBindings.length && ` / ${allBindings.length}`} result{allBindings.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {queryResult.description}
              </p>
            </div>

            {/* --------- results toolbar --------- */}
            {allBindings.length > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 flex-1 px-3 rounded-lg"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                >
                  <Search size={13} style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Filter results…"
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 text-[13px] outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: "var(--text-primary)" }}
                  />
                  {resultFilter && (
                    <button onClick={() => setResultFilter("")}>
                      <X size={13} style={{ color: "var(--text-muted)" }} />
                    </button>
                  )}
                </div>
                <div
                  className="flex items-center rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {(["list", "grid"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className="px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: viewMode === v ? "var(--primary)" : "var(--surface)",
                        color: viewMode === v ? "white" : "var(--text-muted)",
                      }}
                    >
                      {v === "list" ? <LayoutList size={15} /> : <LayoutGrid size={15} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --------- result cards --------- */}
            {bindings.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                {bindings.map((binding, index) => {
                  const flagKey = makeFlagKey(queryResult.name, index);
                  const isFlagged = flaggedKeys.has(flagKey);
                  const displayVars = viewMode === "grid" ? vars.slice(0, 3) : vars;

                  return (
                    <div
                      key={index}
                      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <Card
                        className="ring-0 transition-opacity"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          borderRadius: "12px",
                          opacity: isFlagged ? 0.35 : 1,
                        }}
                      >
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-2 flex-1">
                              {displayVars.map((v) => {
                                const cell = binding[v];
                                if (!cell) return null;
                                const isUri = cell.type === "uri";
                                const display = isUri
                                  ? (cell.value.split(/[/#]/).pop() ?? cell.value)
                                  : cell.value;
                                return (
                                  <div key={v} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                      {v}
                                    </span>
                                    <span className="text-[13px] leading-snug" style={{ color: "var(--text-primary)", wordBreak: "break-word" }}>
                                      {display}
                                    </span>
                                  </div>
                                );
                              })}
                              {viewMode === "grid" && vars.length > 3 && (
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                  +{vars.length - 3} more fields
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleFlagResult(index)}
                            >
                              <ThumbsDown
                                size={14}
                                style={{ color: isFlagged ? "var(--error)" : "var(--text-muted)" }}
                              />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="ring-0" style={{ borderColor: "var(--border)", borderRadius: "12px" }}>
                <CardContent className="p-6 text-center">
                  <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                    No results returned for this query.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* --------- research questions (shown when no results) --------- */}
        {!isLoading && !hasResults && availableCQs.length > 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Browse Research Questions
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Not sure what to search? Click any question to run it against the knowledge graph.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCQs.map((cq) => (
                <button
                  key={cq.name}
                  onClick={() => handleCQClick(cq)}
                  disabled={isLoading}
                  className="text-left p-4 rounded-xl transition-colors hover:bg-[var(--primary-soft)] group"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                >
                  <p className="text-[13px] font-semibold group-hover:text-[var(--primary)] transition-colors" style={{ color: "var(--text-primary)" }}>
                    {cq.title}
                  </p>
                  <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {cq.description}
                  </p>
                  {cq.paramCategory && (
                    <Badge variant="secondary" className="mt-2 text-[10px]" style={{ borderRadius: "4px" }}>
                      needs: {cq.paramCategory}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --------- sparql editor (advanced, always at bottom) --------- */}
        {editableSparql && (
          <Collapsible open={showSparql} onOpenChange={setShowSparql}>
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-1.5 text-[12px] hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                <Code size={13} />
                {showSparql ? "Hide" : "View / Edit"} SPARQL
                <ChevronDown
                  size={13}
                  className="transition-transform duration-200"
                  style={{ transform: showSparql ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 flex flex-col gap-2">
                <Textarea
                  value={editableSparql}
                  onChange={(e) => setEditableSparql(e.target.value)}
                  className="text-[13px] leading-relaxed min-h-[180px] resize-y"
                  style={{
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "16px",
                    color: "var(--text-primary)",
                  }}
                />
                <Button
                  size="sm"
                  onClick={runCustomSparql}
                  disabled={isLoading || !editableSparql.trim()}
                  className="self-end"
                  style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "8px" }}
                >
                  <Play size={13} />
                  Run
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </PageShell>
  );
}

export default function QueryPage() {
  return (
    <Suspense fallback={null}>
      <QueryPageContent />
    </Suspense>
  );
}
