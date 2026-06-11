"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --------- fallback badges ---------
const FALLBACK_BADGES = [
  "Personal Assistant Use Case",
  "Privacy Constraint",
  "Explaining capability",
  "Fair and Accurate Verdict Goal",
  "Semantic Linking Method",
];

// --------- featured categories ---------
const FEATURED_BROADER = [
  "https://w3id.org/hi-thesaurus/UseCase",
  "https://w3id.org/hi-thesaurus/Goal",
  "https://w3id.org/hi-thesaurus/EthicalConstraint",
];

const STEPS = [
  {
    number: 1,
    label: "Type your concept",
    description: "Enter a research topic or question in plain language.",
  },
  {
    number: 2,
    label: "We map it",
    description:
      "The interface aligns your term with the knowledge graph's vocabulary.",
  },
  {
    number: 3,
    label: "Explore results",
    description: "Browse results with full context on why each one matched.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [badges, setBadges] = useState<string[]>(FALLBACK_BADGES);

  // --------- fetch thesaurus badges ---------
  useEffect(() => {
    fetch("/api/sparql/thesaurus")
      .then((r) => r.json())
      .then((data) => {
        if (!data.terms) return;
        const featured = (data.terms as { uri: string; label: string; broader: string | null }[])
          .filter((t) => t.broader && FEATURED_BROADER.includes(t.broader))
          .slice(0, 8)
          .map((t) => t.label);
        if (featured.length > 0) setBadges(featured);
      })
      .catch(() => {});
  }, []);

  function navigate(q: string) {
    if (!q.trim()) return;
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/query?q=${encodeURIComponent(q.trim())}`);
    }, 350);
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className={cn(
          "transition-opacity duration-300",
          isTransitioning && "opacity-0 pointer-events-none"
        )}
      >
        <Navbar />
      </div>

      <main
        className={cn(
          "flex flex-col items-center px-4 pt-20 pb-16 transition-opacity duration-300",
          isTransitioning && "opacity-0 pointer-events-none"
        )}
      >
        {/* --------- hero text --------- */}
        <div className="w-full max-w-xl text-center">
          <h1
            className="font-bold leading-tight tracking-tight"
            style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", color: "var(--text-primary)" }}
          >
            Query the Knowledge Graph
          </h1>
          <p
            className="mt-3 text-[14px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Type a concept or research question. We&apos;ll handle the rest.
          </p>
        </div>

        {/* --------- search bar --------- */}
        <div className="mt-8 w-full max-w-xl">
          <div
            className="flex items-center gap-0 overflow-hidden"
            style={{
              border: `1.5px solid ${isFocused ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "14px",
              backgroundColor: "var(--surface)",
              boxShadow: isFocused
                ? "0 0 0 4px color-mix(in srgb, var(--primary) 15%, transparent), 0 4px 20px color-mix(in srgb, var(--primary) 10%, transparent)"
                : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "border-color 0.2s ease, box-shadow 0.25s ease",
            }}
          >
            {/* --------- search icon --------- */}
            <div
              className="pl-4 pr-2 flex items-center shrink-0 transition-colors duration-200"
              style={{ color: isFocused ? "var(--primary)" : "var(--text-muted)" }}
            >
              <Search size={17} />
            </div>

            {/* --------- input --------- */}
            <input
              type="text"
              placeholder="e.g. human-AI trust, delegation, explainability…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && navigate(query)}
              className="flex-1 bg-transparent py-4 text-[14px] outline-none placeholder:text-[var(--text-muted)]"
              style={{ color: "var(--text-primary)" }}
            />

            {/* --------- search button --------- */}
            <div className="p-2 shrink-0">
              <Button
                onClick={() => navigate(query)}
                disabled={!query.trim() || isTransitioning}
                className="gap-1.5 h-9 px-4 text-[13px]"
                style={{
                  backgroundColor: query.trim() ? "var(--primary)" : "var(--border)",
                  color: query.trim() ? "white" : "var(--text-muted)",
                  borderRadius: "10px",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                }}
              >
                Search
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>

          {/* --------- thesaurus badges --------- */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {badges.map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="cursor-pointer hover:bg-primary-soft hover:text-primary transition-colors text-[12px] px-2.5 py-0.5"
                style={{ borderRadius: "999px" }}
                onClick={() => navigate(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* --------- how it works --------- */}
        <div className="w-full max-w-xl mt-16">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-8 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            How it works
          </p>

          {/* --------- connector row --------- */}
          <div className="relative flex items-start justify-between">
            {/* --------- line behind nodes --------- */}
            <div
              className="absolute top-[14px] left-[14px] right-[14px] h-px"
              style={{
                background:
                  "linear-gradient(to right, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--border)))",
              }}
            />

            {STEPS.map(({ number, label, description }) => (
              <div
                key={number}
                className="relative flex flex-col items-center text-center gap-3"
                style={{ flex: 1 }}
              >
                {/* --------- step node --------- */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10 ring-4"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    boxShadow: "0 0 0 4px var(--background)",
                  }}
                >
                  {number}
                </div>

                {/* --------- step text --------- */}
                <p
                  className="text-[13px] font-semibold leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </p>
                <p
                  className="text-[12px] leading-relaxed px-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
