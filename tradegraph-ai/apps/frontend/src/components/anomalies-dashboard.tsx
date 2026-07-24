"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { analyticsApi, type TradeAnomaly } from "@/lib/api"

export function AnomaliesDashboard() {
  const [importer, setImporter] = useState("")
  const [product, setProduct] = useState("")
  const [severity, setSeverity] = useState("")
  const [descending, setDescending] = useState(true)
  const [selected, setSelected] = useState<TradeAnomaly | null>(null)
  const query = useQuery({
    queryKey: ["anomalies", importer, product],
    queryFn: () => analyticsApi.anomalies({ importer, product }),
  })
  const rows = useMemo(() => {
    const filtered = (query.data?.data ?? []).filter((row) => !severity || row.severity === severity)
    return filtered.toSorted((a, b) => descending ? b.anomaly_score - a.anomaly_score : a.anomaly_score - b.anomaly_score)
  }, [query.data, severity, descending])
  const selectedYear = selected?.year
  const context = (query.data?.data ?? []).filter((row) => selectedYear === undefined || Math.abs(row.year - selectedYear) <= 2)

  return <PageContainer className="py-10">
    <p className="font-mono text-sm text-primary">Transparent rules baseline</p>
    <h1 className="mt-2 text-4xl font-semibold">Trade anomalies</h1>
    <p className="mt-3 max-w-3xl text-muted-foreground">MAD-based robust z-scores, rolling deviation, supplier disappearance, unit-value changes and quantity changes.</p>
    <div className="mt-8 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
      <Label>Importer<Input className="mt-2" maxLength={3} placeholder="ISO3" value={importer} onChange={(event) => setImporter(event.target.value.toUpperCase())} /></Label>
      <Label>HS2 product<Input className="mt-2" maxLength={2} placeholder="All" value={product} onChange={(event) => setProduct(event.target.value)} /></Label>
      <Label>Severity<Select className="mt-2" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">All severities</option><option value="normal">Normal</option><option value="watch">Watch</option><option value="high_anomaly">High anomaly</option></Select></Label>
    </div>
    <div className="mt-6 overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50"><tr><th className="p-3">Year</th><th className="p-3"><button className="underline" onClick={() => setDescending((value) => !value)}>Score {descending ? "↓" : "↑"}</button></th><th className="p-3">Severity</th><th className="p-3">Direction</th><th className="p-3">Explanation</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.year} className="border-t hover:bg-muted/30"><td className="p-3 font-mono"><button className="underline" onClick={() => setSelected(row)}>{row.year}</button></td><td className="p-3 font-mono">{row.anomaly_score.toFixed(2)}</td><td className="p-3"><Severity value={row.severity} /></td><td className="p-3">{row.direction}</td><td className="max-w-xl p-3 text-muted-foreground">{row.explanation}</td></tr>)}</tbody>
      </table>
      {query.isLoading && <p className="p-8 text-muted-foreground">Analyzing annual observations…</p>}
      {!query.isLoading && rows.length === 0 && <p className="p-8 text-muted-foreground">No observations match these filters.</p>}
    </div>
    {selected && <section className="mt-6 rounded-xl border bg-card p-5"><h2 className="font-semibold">Context around {selected.year}</h2><EChart option={{ xAxis: { type: "category", data: context.map((row) => row.year) }, yAxis: { type: "value" }, tooltip: { trigger: "axis" }, series: [{ type: "bar", data: context.map((row) => row.anomaly_score) }] }} /></section>}
  </PageContainer>
}

function Severity({ value }: { value: TradeAnomaly["severity"] }) {
  const classes = value === "high_anomaly" ? "bg-destructive/15 text-destructive" : value === "watch" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{value.replace("_", " ")}</span>
}
