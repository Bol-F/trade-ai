"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import type { EChartsOption } from "echarts"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mlApi } from "@/lib/api"

export function ForecastDashboard() {
  const [importer, setImporter] = useState("CHN")
  const [exporter, setExporter] = useState("UZB")
  const [hs2, setHs2] = useState("01")
  const [year, setYear] = useState("2025")
  const mutation = useMutation({ mutationFn: mlApi.forecast })
  const result = mutation.data
  const option: EChartsOption | undefined = result ? {
    tooltip: { trigger: "axis" },
    legend: { data: ["Historical", "Baseline", "Model"] },
    xAxis: { type: "category", data: [...result.historical_values.map((point) => point.year), result.forecast.year] },
    yAxis: { type: "value" },
    series: [
      { name: "Historical", type: "line", data: [...result.historical_values.map((point) => point.value), null] },
      { name: "Baseline", type: "scatter", data: [...result.historical_values.map(() => null), result.baseline_forecast] },
      { name: "Model", type: "scatter", data: [...result.historical_values.map(() => null), result.forecast.value] },
    ],
  } : undefined

  return <PageContainer className="py-10">
    <p className="font-mono text-sm text-primary">Locally trained · chronological validation</p>
    <h1 className="mt-2 text-4xl font-semibold">Trade forecast</h1>
    <p className="mt-3 max-w-3xl text-muted-foreground">Compare the active project-trained model with the retained three-year moving-average baseline.</p>
    <form className="mt-8 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ importer, exporter, hs2, year: Number(year) }) }}>
      <Label>Importer<Input className="mt-2" maxLength={3} value={importer} onChange={(event) => setImporter(event.target.value.toUpperCase())} /></Label>
      <Label>Exporter<Input className="mt-2" maxLength={3} value={exporter} onChange={(event) => setExporter(event.target.value.toUpperCase())} /></Label>
      <Label>HS2<Input className="mt-2" maxLength={2} value={hs2} onChange={(event) => setHs2(event.target.value)} /></Label>
      <Label>Forecast year<Input className="mt-2" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} /></Label>
      <Button className="self-end" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Forecasting…" : "Run forecast"}</Button>
    </form>
    {mutation.isError && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">The forecast could not be generated. Import data and verify the selected trade lane.</p>}
    {result && option && <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Model forecast" value={money(result.forecast.value)} /><Metric label="Baseline" value={money(result.baseline_forecast)} /><Metric label="Fresh through" value={String(result.data_freshness)} /></div>
      <section className="mt-6 rounded-xl border bg-card p-5"><h2 className="font-semibold">Historical and forecast values</h2><EChart option={option} /></section>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Model metadata</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt className="text-muted-foreground">Model</dt><dd>{result.model_name}</dd><dt className="text-muted-foreground">Version</dt><dd className="font-mono">{result.model_version}</dd><dt className="text-muted-foreground">Dataset</dt><dd>{result.dataset_version}</dd><dt className="text-muted-foreground">Main factors</dt><dd>{result.main_input_factors.join(", ")}</dd></dl></section>
        <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Evaluation metrics</h2>{Object.keys(result.metrics).length === 0 ? <p className="mt-4 text-sm text-muted-foreground">The retained baseline has no trained-model report.</p> : <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">{JSON.stringify(result.metrics, null, 2)}</pre>}</section>
        <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Limitations</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">This statistical forecast uses only the project dataset and historical trade features. It cannot anticipate policy changes, conflict, weather, reporting revisions, or other structural breaks. A baseline is used whenever no eligible active model is available.</p></section>
      </div>
    </>}
  </PageContainer>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>
}
function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value) }
