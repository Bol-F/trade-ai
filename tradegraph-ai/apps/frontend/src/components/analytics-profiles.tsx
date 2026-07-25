"use client"

import { useQuery } from "@tanstack/react-query"
import type { EChartsOption } from "echarts"
import Link from "next/link"
import {
  ChartCard,
  DataFreshnessBadge,
  DatasetVersionBadge,
  ErrorState,
  KpiCard,
  LoadingSkeleton,
  PageHeader,
  RiskIndicator,
} from "@/components/design-system"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { analyticsApi, catalogApi } from "@/lib/api"
import { queryKeys } from "@/lib/query-options"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

function historyOption(points: { year: number; value: string | number | null }[]): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: points.map((point) => point.year) },
    yAxis: { type: "value", axisLabel: { formatter: (value: number) => money.format(value) } },
    series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.14 }, data: points.map((point) => Number(point.value ?? 0)) }],
  }
}

type RankingRow = { label: string; value: string; href?: string }

function Ranking({ title, rows }: { title: string; rows: RankingRow[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data is available for this ranking.</p> : (
          <ol className="space-y-3">
            {rows.map((row, index) => (
              <li key={`${row.label}-${index}`} className="flex items-center justify-between gap-4 border-b pb-3 text-sm last:border-0 last:pb-0">
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{index + 1}</span>
                  {row.href ? <Link className="hover:text-primary hover:underline" href={row.href}>{row.label}</Link> : row.label}
                </span>
                <span className="shrink-0 font-mono">{row.value}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

export function CountryAnalyticsProfile({ iso3 }: { iso3: string }) {
  const normalizedIso3 = iso3.toUpperCase()
  const profile = useQuery({ queryKey: ["country-profile", normalizedIso3], queryFn: () => analyticsApi.countryProfile(normalizedIso3) })
  const catalog = useQuery({ queryKey: queryKeys.country(normalizedIso3), queryFn: () => catalogApi.country(normalizedIso3) })

  if (profile.isLoading) return <ProfileLoading />
  if (profile.isError || !profile.data) return <ProfileError />

  const { data, meta } = profile.data
  const balance = data.total_exports_usd - data.total_imports_usd
  const countryName = catalog.data?.name ?? normalizedIso3
  const chartSummary = `${countryName} annual trade history from ${data.history.at(0)?.year ?? "the first available year"} to ${data.history.at(-1)?.year ?? "the latest available year"}.`

  return (
    <PageContainer className="py-8 sm:py-10">
      <PageHeader
        breadcrumbs={[{ label: "Countries", href: "/countries" }, { label: countryName }]}
        eyebrow={`Country profile · ${normalizedIso3}`}
        title={countryName}
        description="Trade scale, partner concentration, product mix, and supply exposure in one decision-oriented view."
        metadata={<><DatasetVersionBadge version={meta.dataset_version} /><DataFreshnessBadge year={meta.source_period_end} /></>}
        actions={<Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={`/explorer?importer=${normalizedIso3}`}>Open in Explorer</Link>}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total imports" value={money.format(data.total_imports_usd)} detail="Across the active dataset" />
        <KpiCard label="Total exports" value={money.format(data.total_exports_usd)} detail="Across the active dataset" />
        <KpiCard label="Trade balance" value={money.format(balance)} detail={balance >= 0 ? "Export surplus" : "Import deficit"} />
        <KpiCard label="Supplier HHI" value={data.concentration.hhi.toFixed(3)} detail="Higher means more concentrated" />
        <KpiCard label="Exposure score" value={`${data.exposure.score.toFixed(1)} / 100`} detail="Composite supply risk" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Historical trade" description="Annual trade value in current US dollars." summary={chartSummary}>
          <EChart option={historyOption(data.history)} ariaLabel={chartSummary} />
        </ChartCard>
        <Card>
          <CardHeader><CardTitle>Supply exposure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <RiskIndicator score={data.exposure.score} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Volatility</dt><dd className="font-mono">{data.exposure.volatility.toFixed(3)}</dd></div>
              <div><dt className="text-muted-foreground">Suppliers</dt><dd className="font-mono">{data.exposure.supplier_count}</dd></div>
              <div><dt className="text-muted-foreground">HHI</dt><dd className="font-mono">{data.exposure.hhi.toFixed(3)}</dd></div>
              <div><dt className="text-muted-foreground">Quantity data</dt><dd>{data.exposure.quantity_data_available ? "Available" : "Limited"}</dd></div>
            </dl>
            {(data.exposure.insufficient_history || !data.exposure.quantity_data_available) && (
              <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                Interpret cautiously: {data.exposure.insufficient_history ? "fewer than two annual observations. " : ""}
                {!data.exposure.quantity_data_available ? "Quantity history is incomplete." : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Ranking title="Top traded products" rows={data.top_products.map((row) => ({ label: `HS ${row.code}`, value: money.format(row.trade_value_usd), href: `/explorer?importer=${normalizedIso3}&product=${row.code}` }))} />
        <Ranking title="Top suppliers" rows={data.top_suppliers.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd), href: `/explorer?importer=${normalizedIso3}&exporter=${row.iso3}` }))} />
        <Ranking title="Top destinations" rows={data.top_destinations.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd), href: `/explorer?exporter=${normalizedIso3}&importer=${row.iso3}` }))} />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{data.exposure.methodology}</p>
    </PageContainer>
  )
}

export function ProductAnalyticsProfile({ code }: { code: string }) {
  const hs2 = code.slice(0, 2)
  const profile = useQuery({ queryKey: ["product-profile", hs2], queryFn: () => analyticsApi.productProfile(hs2) })
  const catalog = useQuery({ queryKey: queryKeys.product(code), queryFn: () => catalogApi.product(code) })

  if (profile.isLoading) return <ProfileLoading />
  if (profile.isError || !profile.data) return <ProfileError />

  const { data, meta } = profile.data
  const product = catalog.data
  const level = product?.level ?? code.length
  const title = product?.name ?? data.name ?? `HS ${code}`
  const flagged = data.anomalies.filter((item) => item.severity !== "normal")
  const chartSummary = `${title} global annual trade trend with ${flagged.length} flagged year${flagged.length === 1 ? "" : "s"}.`

  return (
    <PageContainer className="py-8 sm:py-10">
      <PageHeader
        breadcrumbs={[{ label: "Products", href: "/products" }, { label: `HS ${code}` }]}
        eyebrow={`Product profile · HS${level} ${code}`}
        title={title}
        description={`Harmonized System level ${level} classification${product?.parent_code ? ` under parent ${product.parent_code}` : ""}. Analytics are calculated at HS2 (${hs2}) for internationally comparable coverage.`}
        metadata={<><Badge variant="outline">HS{level}</Badge><DatasetVersionBadge version={meta.dataset_version} /><DataFreshnessBadge year={meta.source_period_end} /></>}
        actions={<Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={`/explorer?product=${hs2}`}>Open in Explorer</Link>}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Supplier HHI" value={data.concentration.hhi.toFixed(3)} detail="0–1; higher means more concentrated" />
        <KpiCard label="Active exporters" value={String(data.concentration.supplier_count)} />
        <KpiCard label="Flagged years" value={String(flagged.length)} detail={flagged.length ? "Review anomalies" : "No elevated signal"} />
      </div>

      <div className="mt-6">
        <ChartCard title="Global trade trend" description="Annual trade value aggregated for this HS2 category." summary={chartSummary}>
          <EChart option={historyOption(data.global_trend)} ariaLabel={chartSummary} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Ranking title="Top exporters" rows={data.top_exporters.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd), href: `/explorer?exporter=${row.iso3}&product=${hs2}` }))} />
        <Ranking title="Top importers" rows={data.top_importers.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd), href: `/explorer?importer=${row.iso3}&product=${hs2}` }))} />
        <Ranking title="Fastest-growing exporters" rows={data.fastest_growing_countries.map((row) => ({ label: row.iso3, value: percent.format(row.cagr), href: `/explorer?exporter=${row.iso3}&product=${hs2}` }))} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Detected anomalies</CardTitle></CardHeader>
        <CardContent>
          {flagged.length === 0 ? <p className="text-sm text-muted-foreground">No elevated annual anomaly signal was detected.</p> : (
            <ul className="space-y-3">
              {flagged.map((item) => (
                <li key={item.year} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{item.year}</span><Badge variant={item.severity === "high_anomaly" ? "destructive" : "secondary"}>{item.severity.replace("_", " ")}</Badge><span className="text-muted-foreground">{item.direction}</span></div>
                  <p className="mt-2 text-muted-foreground">{item.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function ProfileLoading() {
  return <PageContainer className="py-10"><LoadingSkeleton rows={5} /></PageContainer>
}

function ProfileError() {
  return <PageContainer className="py-16"><ErrorState title="Analytics unavailable" description="The profile could not be loaded. Check the active dataset and try again." /></PageContainer>
}
