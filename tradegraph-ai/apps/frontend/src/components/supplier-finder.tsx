"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Check, Scale } from "lucide-react"
import { DataFreshnessBadge, EmptyState, ErrorState, FilterBar, FilterSection, PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mlApi, type SupplierRecommendation } from "@/lib/api"

const componentLabels: Record<string, string> = {
  export_capacity: "Export capacity", export_growth: "Growth", export_stability: "Stability",
  estimated_unit_value: "Estimated unit value", existing_trade_relationship: "Existing relationship",
  supplier_diversification: "Diversification",
}

export function SupplierFinder() {
  const [importer, setImporter] = useState("USA")
  const [hs2, setHs2] = useState("01")
  const [year, setYear] = useState("2024")
  const [selected, setSelected] = useState<string[]>([])
  const mutation = useMutation({ mutationFn: mlApi.recommendations })
  const result = mutation.data
  function toggle(country: string) {
    setSelected(current => current.includes(country) ? current.filter(item => item !== country) : current.length < 4 ? [...current, country] : current)
  }
  const comparison = result?.candidates.filter(candidate => selected.includes(candidate.country)) ?? []
  return <PageContainer className="py-10">
    <PageHeader eyebrow="Explainable sourcing analysis" title="Supplier Finder" description="Rank potential exporters using transparent capacity, growth, stability, relationship, unit-value, and diversification components—not one unexplained score." breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Supplier Finder" }]} metadata={result && <DataFreshnessBadge year={result.data_freshness} />} />
    <FilterBar title="Sourcing question"><form onSubmit={event => { event.preventDefault(); setSelected([]); mutation.mutate({ importer, hs2, year: Number(year) }) }}><FilterSection className="sm:grid-cols-4 xl:grid-cols-4">
      <Label>Importing country<Input className="mt-2" maxLength={3} value={importer} onChange={event => setImporter(event.target.value.toUpperCase())} /></Label>
      <Label>HS2 product<Input className="mt-2" maxLength={2} value={hs2} onChange={event => setHs2(event.target.value.replace(/\D/g, ""))} /></Label>
      <Label>Reference year<Input className="mt-2" value={year} onChange={event => setYear(event.target.value)} /></Label>
      <Button className="self-end" disabled={mutation.isPending}>{mutation.isPending ? "Ranking…" : "Find suppliers"}</Button>
    </FilterSection></form></FilterBar>
    {mutation.isError && <div className="mt-6"><ErrorState description="Candidates could not be ranked. Verify the importer, product, and active data coverage." /></div>}
    {result && <><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{result.methodology}</p><Badge variant="outline">{selected.length}/4 selected for comparison</Badge></div>
      {result.candidates.length === 0 ? <div className="mt-6"><EmptyState description="No exporters meet the positive-trade and minimum-history rules." /></div> :
        <div className="mt-6 grid gap-4">{result.candidates.map((candidate, index) => <CandidateCard key={candidate.country} candidate={candidate} rank={index + 1} selected={selected.includes(candidate.country)} onToggle={() => toggle(candidate.country)} />)}</div>}
      {comparison.length >= 2 && <section className="mt-8 rounded-xl border bg-card p-5"><div className="flex items-center gap-2"><Scale className="size-5 text-primary" /><h2 className="font-semibold">Supplier comparison</h2></div><p className="mt-1 text-sm text-muted-foreground">Compare two to four selected candidates. Scores support investigation; they do not include logistics, sanctions, quality, or contract terms.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><caption className="sr-only">Selected supplier component comparison</caption><thead><tr><th className="p-3 text-left">Supplier</th><th>Overall</th>{Object.values(componentLabels).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{comparison.map(candidate => <tr className="border-t" key={candidate.country}><th className="p-3 text-left">{candidate.name} ({candidate.country})</th><td className="text-center font-mono">{candidate.recommendation_score.toFixed(1)}</td>{Object.keys(componentLabels).map(key => <td className="text-center font-mono" key={key}>{Math.round((candidate.component_scores[key] ?? 0) * 100)}</td>)}</tr>)}</tbody></table></div></section>}
    </>}
  </PageContainer>
}

function CandidateCard({ candidate, rank, selected, onToggle }: { candidate: SupplierRecommendation; rank: number; selected: boolean; onToggle: () => void }) {
  return <Card className="shadow-none"><CardHeader className="flex-row items-start justify-between"><div><p className="font-mono text-xs text-muted-foreground">Rank {rank}</p><CardTitle className="mt-1">{candidate.name} <span className="font-mono text-sm font-normal text-muted-foreground">{candidate.country}</span></CardTitle></div><Button variant={selected ? "default" : "outline"} size="sm" onClick={onToggle}>{selected && <Check />} {selected ? "Selected" : "Compare"}</Button></CardHeader>
    <CardContent><div className="grid gap-5 lg:grid-cols-[140px_1fr_240px]"><div><p className="text-xs uppercase text-muted-foreground">Overall score</p><p className="mt-2 font-mono text-3xl font-semibold">{candidate.recommendation_score.toFixed(1)}</p><p className="text-xs text-muted-foreground">out of 100</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(componentLabels).map(([key, label]) => { const value = Math.round((candidate.component_scores[key] ?? 0) * 100); return <div key={key}><div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono">{value}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div> })}</div><div><p className="text-xs uppercase text-muted-foreground">Why it ranked</p><div className="mt-2 flex flex-wrap gap-1.5">{candidate.reasons.length ? candidate.reasons.map(reason => <Badge key={reason} variant="secondary">{reason}</Badge>) : <span className="text-sm text-muted-foreground">Balanced component profile</span>}</div></div></div></CardContent>
  </Card>
}
