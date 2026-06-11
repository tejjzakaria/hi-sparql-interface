"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search, X, Code, ChevronDown, Loader, BookOpen,
  ThumbsDown, LayoutList, LayoutGrid,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  const [mode, setMode] = useState<"disambiguation" | "conversational" | null>(null);
  const [allTerms, setAllTerms] = useState<ThesaurusTerm[]>([]);
  const [suggestions, setSuggestions] = useState<ThesaurusTerm[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [disambiguationTerms, setDisambiguationTerms] = useState<ThesaurusTerm[]>([]);
  const [availableCQs, setAvailableCQs] = useState<CQMeta[]>([]);
  const [selectedCQ, setSelectedCQ] = useState<string | null>(null);
  const [showCQPanel, setShowCQPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [resultFilter, setResultFilter] = useState("");
  const [flaggedKeys, setFlaggedKeys] = useState<Set<string>>(new Set());
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // --------- load flags from storage ---------
  useEffect(() => {
    setFlaggedKeys(getFlaggedKeys());
  }, []);

  // --------- load thesaurus ---------
  useEffect(() => {
    fetch("/api/sparql/thesaurus")
      .then((r) => r.json())
      .then((data) => { if (data.terms) setAllTerms(data.terms); })
      .catch(() => {});
  }, []);

  // --------- load cq list ---------
  useEffect(() => {
    fetch("/api/sparql/queries")
      .then((r) => r.json())
      .then((data) => { if (data.queries) setAvailableCQs(data.queries); })
      .catch(() => {});
  }, []);

  // --------- prefill from url ---------
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    const decoded = decodeURIComponent(q);
    setQuery(decoded);
    executeTextQuery(decoded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --------- autocomplete filter ---------
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

  // --------- close suggestions on outside click ---------
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      const count = data.results?.results?.bindings?.length ?? 0;
      const outcome = count > 0 ? "successful" : "no-results";

      // --------- persist to history ---------
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
      if (mode === "disambiguation" && fuzzy.length > 0) {
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

    const cqMeta = availableCQs.find((c) => c.name === cqNames[0]);
    runCQ(cqNames[0], matched.uri, cqMeta?.paramName ?? null, text, matched.label);
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
    const cqMeta = availableCQs.find((c) => c.name === cqNames[0]);
    runCQ(cqNames[0], term.uri, cqMeta?.paramName ?? null, term.label, term.label);
  }

  function handleClear() {
    setQuery("");
    setIsLoading(false);
    setQueryResult(null);
    setShowSparql(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setDisambiguationTerms([]);
    setSelectedCQ(null);
    setResultFilter("");
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

  // --------- keyword filter on results ---------
  const bindings = resultFilter.trim()
    ? allBindings.filter((b) =>
        Object.values(b).some((cell) =>
          cell.value.toLowerCase().includes(resultFilter.toLowerCase())
        )
      )
    : allBindings;

  return (
    <PageShell
      title="Query the Knowledge Graph"
      subtitle="Type a concept or research question and we'll map it to the Hybrid Intelligence ontology."
    >
      <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[400ms]">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 items-start">
          {/* --------- left column --------- */}
          <div className="animate-in fade-in slide-in-from-left-4 fill-mode-both duration-[400ms] flex flex-col gap-4">
            <Card
              className="ring-0 border"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
              }}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <p className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
                  Your Query
                </p>

                {/* --------- textarea + suggestions --------- */}
                <div className="relative" ref={suggestionsRef}>
                  <Textarea
                    placeholder="e.g. how do humans develop trust in AI systems?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRunQuery(); }
                      if (e.key === "Escape") setShowSuggestions(false);
                    }}
                    className="min-h-[120px] text-[15px]"
                    style={{ borderColor: "var(--border)" }}
                  />

                  {/* --------- autocomplete dropdown --------- */}
                  {showSuggestions && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
                      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      {suggestions.map((term) => (
                        <button
                          key={term.uri}
                          onMouseDown={() => handleSelectSuggestion(term)}
                          className="w-full text-left px-4 py-3 text-[13px] transition-colors hover:bg-[var(--primary-soft)] flex items-start gap-3"
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <span className="flex-1" style={{ color: "var(--text-primary)" }}>
                            {term.label}
                          </span>
                          <Badge variant="secondary" className="text-[10px] shrink-0" style={{ borderRadius: "6px" }}>
                            {getCategory(term.broader)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* --------- action buttons --------- */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleRunQuery}
                    disabled={isLoading || !query.trim()}
                    style={{ backgroundColor: "var(--primary)", color: "white", borderRadius: "8px" }}
                  >
                    <Search size={16} />
                    Run Query
                  </Button>
                  <Button variant="outline" onClick={handleClear} style={{ borderRadius: "8px" }}>
                    <X size={16} />
                    Clear
                  </Button>
                </div>

                {/* --------- sparql collapsible --------- */}
                {queryResult?.sparql && (
                  <Collapsible open={showSparql} onOpenChange={setShowSparql}>
                    <CollapsibleTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 text-[13px] hover:opacity-80 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Code size={14} />
                        {showSparql ? "Hide" : "Show"} generated SPARQL
                        <ChevronDown
                          size={14}
                          className="transition-transform duration-200"
                          style={{ transform: showSparql ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre
                        className="mt-3 overflow-x-auto text-[13px] leading-relaxed"
                        style={{
                          fontFamily: "var(--font-mono)",
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "16px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {queryResult.sparql}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Separator />

                {/* --------- interaction mode --------- */}
                <div className="flex flex-col gap-3">
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>
                    Interaction Mode
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(["disambiguation", "conversational"] as const).map((m) => (
                      <Button
                        key={m}
                        variant="outline"
                        size="sm"
                        onClick={() => setMode(mode === m ? null : m)}
                        style={
                          mode === m
                            ? { backgroundColor: "var(--primary-soft)", color: "var(--primary)", borderColor: "var(--primary)", borderRadius: "8px" }
                            : { borderRadius: "8px" }
                        }
                      >
                        {m === "disambiguation" ? "Disambiguation" : "Conversational"}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* --------- cq browser --------- */}
            {availableCQs.length > 0 && (
              <Card
                className="ring-0 border"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "12px" }}
              >
                <CardContent className="p-5 flex flex-col gap-3">
                  <button
                    onClick={() => setShowCQPanel((v) => !v)}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} style={{ color: "var(--text-muted)" }} />
                      <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                        Competency Questions
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{
                        color: "var(--text-muted)",
                        transform: showCQPanel ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  {showCQPanel && (
                    <div className="flex flex-col gap-2 mt-1">
                      {availableCQs.map((cq) => (
                        <button
                          key={cq.name}
                          onClick={() => handleCQClick(cq)}
                          disabled={isLoading}
                          className="text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--primary-soft)] text-[12px]"
                          style={{
                            border: "1px solid var(--border)",
                            backgroundColor: selectedCQ === cq.name ? "var(--primary-soft)" : "transparent",
                            color: selectedCQ === cq.name ? "var(--primary)" : "var(--text-primary)",
                          }}
                        >
                          <span className="font-medium">{cq.title}</span>
                          {cq.paramCategory && (
                            <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                              [{cq.paramCategory}]
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* --------- right column --------- */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              // --------- loading state ---------
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-[14px]" style={{ color: "var(--text-muted)" }}>
                  <Loader size={16} className="animate-spin" />
                  Searching the knowledge graph...
                </div>
                <Skeleton className="h-[80px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[80px] w-full rounded-xl" />
              </div>
            ) : (
              <>
                {/* --------- disambiguation panel --------- */}
                {mode === "disambiguation" && disambiguationTerms.length > 0 && (
                  <Card className="ring-0 border" style={{ borderColor: "var(--border)", borderRadius: "12px" }}>
                    <CardContent className="p-5 flex flex-col gap-3">
                      <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                        We couldn&apos;t find an exact match
                      </p>
                      <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        Did you mean one of these concepts from the ontology?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {disambiguationTerms.map((term) => (
                          <Badge
                            key={term.uri}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary-soft hover:text-primary transition-colors"
                            style={{ borderRadius: "6px" }}
                            onClick={() => handleSelectSuggestion(term)}
                          >
                            {term.label}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* --------- results panel --------- */}
                {queryResult && allBindings.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {/* --------- results header --------- */}
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-bold flex-1" style={{ color: "var(--text-primary)" }}>
                        {queryResult.title}
                      </p>
                      <Badge variant="secondary" style={{ borderRadius: "6px" }}>
                        {bindings.length}
                        {bindings.length !== allBindings.length && ` / ${allBindings.length}`}
                      </Badge>
                    </div>
                    <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                      {queryResult.description}
                    </p>

                    {/* --------- results toolbar --------- */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-2 flex-1 px-3 rounded-lg"
                        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                      >
                        <Search size={13} style={{ color: "var(--text-muted)" }} />
                        <input
                          type="text"
                          placeholder="Filter results..."
                          value={resultFilter}
                          onChange={(e) => setResultFilter(e.target.value)}
                          className="flex-1 bg-transparent py-2 text-[13px] outline-none placeholder:text-[var(--text-muted)]"
                          style={{ color: "var(--text-primary)" }}
                        />
                        {resultFilter && (
                          <button onClick={() => setResultFilter("")}>
                            <X size={13} style={{ color: "var(--text-muted)" }} />
                          </button>
                        )}
                      </div>

                      {/* --------- view toggle --------- */}
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

                    {/* --------- result cards --------- */}
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
                              className="ring-0 border transition-opacity"
                              style={{
                                backgroundColor: "var(--surface)",
                                borderColor: "var(--border)",
                                borderRadius: "12px",
                                opacity: isFlagged ? 0.35 : 1,
                              }}
                            >
                              <CardContent className="p-4 flex flex-col gap-2">
                                {/* --------- flag button --------- */}
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
                                          <span
                                            className="text-[10px] font-semibold uppercase tracking-wide"
                                            style={{ color: "var(--text-muted)" }}
                                          >
                                            {v}
                                          </span>
                                          <span
                                            className="text-[13px] leading-snug"
                                            style={{ color: "var(--text-primary)", wordBreak: "break-word" }}
                                          >
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
                                      size={15}
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
                  </div>
                )}

                {/* --------- empty state --------- */}
                {queryResult && allBindings.length === 0 && (
                  <Card className="ring-0 border" style={{ borderColor: "var(--border)", borderRadius: "12px" }}>
                    <CardContent className="p-5">
                      <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                        No results returned for this query.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
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
