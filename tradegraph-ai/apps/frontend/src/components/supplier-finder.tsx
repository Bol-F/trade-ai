"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mlApi } from "@/lib/api"

const componentLabels: Record<string, string> = {
  export_capacity: "Export capacity",
  export_growth: "Export growth",
  export_stability: "Stability",
  estimated_unit_value: "Estimated unit value",
  existing_trade_relationship: "Existing relationship",
  supplier_diversification: "Diversification",
}

export function SupplierFinder() {
  const [importer, setImporter] = useState("USA")
  const [hs2, setHs2] = useState("01")
  const [year, setYear] = useState("2024")
  const mutation = useMutation({ mutationFn: mlApi.recommendations })
  const result = mutation.data
  return <PageContainer className="py-10">
    <p className="font-mono text-sm text-primary">Transparent candidate ranking</p>
    <h1 className="mt-2 text-4xl font-semibold">Supplier Finder</h1>
    <p className="mt-3 max-w-3xl text-muted-foreground">Find exporters with recent positive trade, sufficient history, and explainable component scores.</p>
    <form className="mt-8 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ importer, hs2, year: Number(year) }) }}>
      <Label>Importing country<Input className="mt-2" maxLength={3} value={importer} onChange={(event) => setImporter(event.target.value.toUpperCase())} /></Label>
      <Label>HS2 product<Input className="mt-2" maxLength={2} value={hs2} onChange={(event) => setHs2(event.target.value)} /></Label>
      <Label>Reference year<Input className="mt-2" value={year} onChange={(event) => setYear(event.target.value)} /></Label>
      <Button className="self-end" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Ranking…" : "Find suppliers"}</Button>
    </form>
    {mutation.isError && <p className="mt-6 text-destructive">Candidates could not be ranked.</p>}
    {result && <>
      <p className="mt-5 text-xs text-muted-foreground">{result.methodology} Data is fresh through {result.data_freshness}.</p>
      {result.candidates.length === 0 ? <p className="mt-8 rounded-xl border p-8 text-muted-foreground">No suppliers meet the minimum-history rules.</p> :
        <div className="mt-6 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm">
          <thead className="bg-muted/50"><tr><th className="p-3">Rank</th><th className="p-3">Supplier</th><th className="p-3">Score</th>{Object.values(componentLabels).map((label) => <th key={label} className="p-3">{label}</th>)}<th className="p-3">Reasons</th></tr></thead>
          <tbody>{result.candidates.map((candidate, index) => <tr key={candidate.country} className="border-t"><td className="p-3 font-mono">{index + 1}</td><td className="p-3 font-medium">{candidate.name} <span className="font-mono text-muted-foreground">({candidate.country})</span></td><td className="p-3 font-mono font-semibold">{candidate.recommendation_score.toFixed(1)}</td>{Object.keys(componentLabels).map((key) => <td key={key} className="p-3 font-mono">{Math.round((candidate.component_scores[key] ?? 0) * 100)}</td>)}<td className="min-w-56 p-3 text-muted-foreground">{candidate.reasons.join(", ") || "Balanced profile"}</td></tr>)}</tbody>
        </table></div>}
    </>}
  </PageContainer>
}
