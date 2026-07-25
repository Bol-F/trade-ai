import { PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"

const terms: Record<string, string> = {
  Importer: "The reporting destination that buys or receives a traded product.",
  Exporter: "The reporting origin that sells or sends a traded product.",
  "HS classification": "The international Harmonized System used to classify traded goods.",
  HS2: "A broad two-digit Harmonized System chapter.",
  HS4: "A four-digit Harmonized System heading.",
  HS6: "A detailed six-digit internationally comparable product code.",
  "Trade value": "The reported monetary value of a trade flow, shown here in current US dollars.",
  Quantity: "The reported physical amount, normalized to tonnes where source data permits.",
  "Unit value": "Trade value divided by valid quantity; a proxy, not necessarily a market price.",
  "Supplier share": "A supplier’s fraction of an importer’s observed product imports.",
  "Trade balance": "Exports minus imports for the selected scope.",
  HHI: "The sum of squared supplier shares, used as a concentration indicator.",
  CAGR: "Compound annual growth rate across a multi-year period.",
  Volatility: "Variation in annual observed values or growth.",
  "Exposure score": "A 0–100 composite indicator of concentration and instability.",
  "Forecast baseline": "A simple previous-year or moving-average estimate used to judge a model.",
  Anomaly: "A statistical observation that differs from its history; not proof of fraud.",
  "Dataset version": "An immutable identifier for the exact imported data used in analysis.",
}
export default function GlossaryPage() { return <PageContainer className="py-10"><PageHeader eyebrow="Reference" title="Trade analytics glossary" description="Plain-language definitions for technical terms used throughout the product." breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Glossary" }]} /><dl className="mt-8 divide-y rounded-xl border bg-card">{Object.entries(terms).map(([term, definition]) => <div key={term} id={term.toLowerCase().replaceAll(" ", "-")} className="grid gap-2 p-5 sm:grid-cols-[12rem_1fr]"><dt className="font-medium">{term}</dt><dd className="text-sm leading-6 text-muted-foreground">{definition}</dd></div>)}</dl></PageContainer> }
