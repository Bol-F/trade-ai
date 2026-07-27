"use client"

import { useMemo, useState } from "react"
import { CalendarClock, Gauge, LineChart, Radio, TrendingUp } from "lucide-react"

import { ConfidenceIndicator, RiskIndicator, StatusBadge } from "@/components/design-system"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { EChart } from "@/components/echarts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { marketPriceSeries } from "@/lib/dashboard-demo-data"
import { dataVisualizationTokens } from "@/lib/design-tokens"

type Timeframe = keyof typeof marketPriceSeries
const timeframes = Object.keys(marketPriceSeries) as Timeframe[]

export function MarketAnalysisDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M")
  const [asset, setAsset] = useState("NVDA")
  const series = marketPriceSeries[timeframe]
  const chartOption = useMemo(() => ({
    animationDuration: 200,
    grid: { left: 20, right: 20, top: 24, bottom: 30, containLabel: true },
    tooltip: { trigger: "axis" as const, valueFormatter: (value: unknown) => `$${Number(value).toFixed(2)}` },
    xAxis: { type: "category" as const, data: series.map((_, index) => `${timeframe} ${index + 1}`), boundaryGap: false, axisLabel: { color: dataVisualizationTokens.neutral }, axisLine: { lineStyle: { color: dataVisualizationTokens.grid } } },
    yAxis: { type: "value" as const, scale: true, axisLabel: { color: dataVisualizationTokens.neutral, formatter: (value: number) => `$${value.toFixed(0)}` }, splitLine: { lineStyle: { color: dataVisualizationTokens.grid } } },
    series: [{ type: "line" as const, data: series, smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { color: dataVisualizationTokens.primary, width: 3 }, itemStyle: { color: dataVisualizationTokens.primary }, areaStyle: { color: dataVisualizationTokens.primary, opacity: 0.08 } }],
  }), [series, timeframe])

  return (
    <>
      <DashboardPageHeader title="Market Analysis" description="Explore illustrative market structure, technical context, sentiment, events, and explainable AI risk assessment." action={<label className="flex min-w-48 items-center gap-2"><span className="text-sm text-muted-foreground">Asset</span><Select value={asset} onChange={(event) => setAsset(event.target.value)}><option value="NVDA">NVDA · NVIDIA</option><option value="MSFT">MSFT · Microsoft</option><option value="SPY">SPY · S&P 500 ETF</option></Select></label>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-0 py-0 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Current price</p><p className="mt-4 font-mono text-2xl font-semibold">${asset === "NVDA" ? "128.44" : asset === "MSFT" ? "442.31" : "548.99"}</p><p className="mt-2 flex items-center gap-1 text-xs text-success"><TrendingUp aria-hidden="true" className="size-3.5" />+2.80% today</p></CardContent></Card>
        <Card className="gap-0 py-0 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Volume</p><p className="mt-4 font-mono text-2xl font-semibold">312.4M</p><p className="mt-2 text-xs text-muted-foreground">1.32× 20-day average</p></CardContent></Card>
        <Card className="gap-0 py-0 shadow-none"><CardContent className="p-5"><p className="mb-4 text-sm text-muted-foreground">Market sentiment</p><ConfidenceIndicator value={72} label="Positive sentiment" /></CardContent></Card>
        <Card className="gap-0 py-0 shadow-none"><CardContent className="p-5"><p className="mb-4 text-sm text-muted-foreground">Risk assessment</p><RiskIndicator score={48} /></CardContent></Card>
      </section>
      <Card className="mt-4 shadow-none"><CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Price movement</CardTitle><p className="mt-1 text-xs text-muted-foreground">Interactive illustrative series with hover values</p></div><Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}><TabsList aria-label="Chart timeframe" className="max-w-full overflow-x-auto">{timeframes.map((item) => <TabsTrigger key={item} value={item}>{item}</TabsTrigger>)}</TabsList></Tabs></CardHeader><CardContent><EChart option={chartOption} ariaLabel={`${asset} illustrative ${timeframe} price chart`} /></CardContent></Card>
      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><LineChart aria-hidden="true" className="size-4 text-primary" />Technical indicators</CardTitle></CardHeader><CardContent className="divide-y text-sm">{[["RSI (14)", "61.8", "Positive, not overbought"], ["MACD", "+1.42", "Bullish crossover"], ["50-day average", "$119.80", "Price above average"], ["Volume trend", "Rising", "Confirmation present"]].map(([label, value, note]) => <div key={label} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{note}</p></div><span className="font-mono">{value}</span></div>)}</CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge aria-hidden="true" className="size-4 text-primary" />Key levels</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-lg bg-success-surface p-4"><p className="text-xs text-muted-foreground">Support levels</p><p className="mt-2 font-mono font-semibold text-success">$123.10 · $119.80</p></div><div className="rounded-lg bg-danger-surface p-4"><p className="text-xs text-muted-foreground">Resistance levels</p><p className="mt-2 font-mono font-semibold text-destructive">$130.20 · $135.00</p></div><p className="text-xs leading-5 text-muted-foreground">Levels are model-derived zones, not guaranteed turning points.</p></CardContent></Card>
        <Card className="shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock aria-hidden="true" className="size-4 text-primary" />Important events</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-3"><Radio aria-hidden="true" className="mt-0.5 size-4 text-warning" /><div><p className="text-sm font-medium">Earnings release</p><p className="mt-1 text-xs text-muted-foreground">Aug 21 · after market close</p></div></div><div className="flex gap-3"><CalendarClock aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-sm font-medium">US inflation report</p><p className="mt-1 text-xs text-muted-foreground">Aug 14 · high market impact</p></div></div></CardContent></Card>
      </section>
      <Card className="mt-4 border-primary/25 bg-primary/[0.035] shadow-none"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-base">AI-generated summary</CardTitle><StatusBadge tone="warning">Moderate risk</StatusBadge></div></CardHeader><CardContent><p className="text-sm leading-7 text-muted-foreground">The illustrative setup remains constructive: price is above its medium-term average, momentum is positive, and volume provides confirmation. Near-term resistance and event-driven volatility reduce confidence. A break below support would weaken the current interpretation.</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="secondary">Momentum positive</Badge><Badge variant="secondary">Volume confirmed</Badge><Badge variant="outline">Event risk elevated</Badge></div><p className="mt-5 text-xs text-muted-foreground">Demo analysis only. Not financial advice or a prediction of future performance.</p></CardContent></Card>
    </>
  )
}
