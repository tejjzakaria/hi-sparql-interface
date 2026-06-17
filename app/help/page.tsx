import { Info, GitMerge, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --------- step data ---------
const steps = [
  {
    number: 1,
    title: "Type your question",
    description: 
      "Enter a research concept, topic, or question in plain language on the home page or query page. No SPARQL knowledge needed.",
  },
  {
    number: 2,
    title: "Resolve mismatches",
    description:
      "If your term doesn't exactly match the ontology, the interface will suggest the closest concepts or ask clarifying questions to narrow down your intent.",
  },
  {
    number: 3,
    title: "Explore your Results",
    description:
      "Browse results with full provenance — each result tells you exactly why it matched your query and how it connects to the knowledge graph.",
  },
];

// --------- mode data ---------
const modes = [
  {
    icon: GitMerge,
    title: "Disambiguation Mode",
    description:
      "When your search term doesn't match the ontology directly, disambiguation mode suggests the closest formally defined concepts. Select the best match and the interface runs the query for you.",
    badge: "Best for: exploratory search",
  },
  {
    icon: MessageSquare,
    title: "Conversational Mode",
    description:
      "Conversational mode asks you a short series of clarifying questions before running the query. Each answer narrows your intent and shapes the SPARQL query progressively.",
    badge: "Best for: precise queries",
  },
];

// --------- faq data ---------
const faqs = [
  {
    value: "faq-1",
    question: "What is the Hybrid Intelligence knowledge graph?",
    answer:
      "A structured semantic database encoding concepts, relationships, and publications from the Hybrid Intelligence research field. It is built on an ontology that formally defines how concepts like trust, delegation, and explainability relate to each other.",
  },
  {
    value: "faq-2",
    question: "Do I need to know SPARQL to use this interface?",
    answer:
      "No. The interface translates your natural language input into SPARQL queries automatically. You can optionally view the generated query for transparency.",
  },
  {
    value: "faq-3",
    question: "What does it mean when a term is not found?",
    answer:
      "It means your search term does not directly match a concept in the ontology. The interface will either suggest alternatives (disambiguation mode) or ask clarifying questions (conversational mode) to help you find the closest match.",
  },
  {
    value: "faq-4",
    question: "Why do some results seem unrelated to my query?",
    answer:
      "Results are matched based on ontology relationships, which may include sub-concepts or linked concepts you did not explicitly search for. Use the provenance label on each result to understand why it appeared, and flag it as irrelevant if needed.",
  },
  {
    value: "faq-5",
    question: "What happens when I flag a result as irrelevant?",
    answer:
      "Flagged results are recorded in your query history and excluded from future similar queries. This helps improve result quality over time.",
  },
  {
    value: "faq-6",
    question: "Can I export my query results?",
    answer:
      "Export functionality is planned for a future version of the interface.",
  },
];

export default function HelpPage() {
  return (
    <PageShell
      title="Help & Onboarding"
      subtitle="Everything you need to know to get started with HI Query."
    >
      {/* --------- getting started --------- */}
      <section>
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Getting Started
        </h2>

        <div className="flex flex-col gap-4">
          {steps.map(({ number, title, description }) => (
            <Card
              key={number}
              className="ring-0 border"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* --------- step number --------- */}
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {number}
                  </div>

                  {/* --------- step text --------- */}
                  <div>
                    <p
                      className="text-[15px] font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {title}
                    </p>
                    <p
                      className="mt-1.5 text-[13px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* --------- provenance section --------- */}
      <section className="mt-12">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Understanding Provenance
        </h2>

        <Card
          className="ring-0 border"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            borderRadius: "12px",
          }}
        >
          <CardContent className="p-6">
            <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
              Provenance tells you why a result appeared. Every result in HI
              Query includes a provenance label that traces exactly which
              ontology concept matched your query and how it relates to your
              search term. This helps you understand the knowledge graph&apos;s
              structure and refine your queries.
            </p>

            <Separator className="my-5" />

            {/* --------- provenance example --------- */}
            <p
              className="text-[12px] font-bold mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Example provenance label
            </p>
            <div className="flex items-start gap-2">
              <Info
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--primary)" }}
              />
              <p
                className="text-[13px] italic"
                style={{ color: "var(--text-muted)" }}
              >
                This paper was returned because it is tagged with hi:Reliance,
                which is a sub-concept of hi:Trust in the Hybrid Intelligence
                ontology.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --------- interaction modes --------- */}
      <section className="mt-12">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Interaction Modes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map(({ icon: Icon, title, description, badge }) => (
            <Card
              key={title}
              className="ring-0 border"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
              }}
            >
              <CardContent className="p-6 flex flex-col gap-3">
                <Icon size={22} style={{ color: "var(--primary)" }} />
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </p>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {description}
                </p>
                <div className="mt-auto pt-2">
                  <Badge variant="outline" style={{ borderRadius: "6px" }}>
                    {badge}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* --------- faq section --------- */}
      <section className="mt-12 mb-8">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Frequently Asked Questions
        </h2>

        <div
          className="overflow-hidden border"
          style={{ borderColor: "var(--border)", borderRadius: "12px" }}
        >
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value}>
                <AccordionTrigger
                  className="px-6 py-4 text-[14px] font-medium hover:no-underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent
                  className="px-6 pb-4 text-[13px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </PageShell>
  );
}
