"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { BarChart3, Boxes, Globe2, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ChartCard, DataFreshnessBadge, DatasetVersionBadge, EmptyState, ErrorState, FilterBar, FilterSection, KpiCard, LoadingSkeleton, PageHeader } from "@/components/design-system"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { toTimeseriesOption, type TimeseriesMetric } from "@/lib/chart-transform"
import { catalogApi, savedAnalysesApi, tradeApi, type TradeFilters } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-options"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 })
const number = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export function ExplorerDashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const initialFilters = useMemo<TradeFilters>(() => ({
    importer: searchParams.get("importer") ?? "", exporter: searchParams.get("exporter") ?? "",
    product: searchParams.get("product") ?? "", start_year: searchParams.get("start_year") ?? "2017",
    end_year: searchParams.get("end_year") ?? "2024",
  }), [searchParams])
  const [draft, setDraft] = useState<TradeFilters>(initialFilters)
  const [filters, setFilters] = useState<TradeFilters>(initialFilters)
  const [metric, setMetric] = useState<TimeseriesMetric>("trade_value_usd")
  const countries = useQuery({ queryKey: queryKeys.countries(), queryFn: () => catalogApi.countries("") })
  const overview = useQuery({ queryKey: ["trade-overview", filters], queryFn: () => tradeApi.overview(filters) })
  const timeseries = useQuery({ queryKey: ["trade-timeseries", filters], queryFn: () => tradeApi.timeseries(filters) })
  const partners = useQuery({ queryKey: ["trade-partners", filters], queryFn: () => tradeApi.partners(filters) })
  const products = useQuery({ queryKey: ["trade-top-products", filters], queryFn: () => tradeApi.topProducts(filters) })
  const chartOption = useMemo(() => toTimeseriesOption(timeseries.data?.data ?? [], metric), [timeseries.data, metric])
  const loading = overview.isLoading || timeseries.isLoading || partners.isLoading || products.isLoading
  const failed = overview.isError || timeseries.isError || partners.isError || products.isError
  const saveAnalysis = useMutation({ mutationFn: () => savedAnalysesApi.create({ title: `Trade analysis ${new Date().toISOString().slice(0, 10)}`, filters, visualization: "explorer" }) })

  function apply(event: FormEvent) {
    event.preventDefault(); setFilters({ ...draft })
    const params = new URLSearchParams()
    Object.entries(draft).forEach(([key, value]) => { if (value) params.set(key, value) })
    router.replace(`/explorer?${params.toString()}`, { scroll: false })
  }
  function reset() {
    const cleared = { start_year: "2017", end_year: "2024" }
    setDraft(cleared); setFilters(cleared); router.replace("/explorer", { scroll: false })
  }

  return <PageContainer className="py-10 md:py-14">
    <PageHeader eyebrow={t("explorer.eyebrow")} title={t("explorer.title")} description={t("explorer.description")}
      breadcrumbs={[{ label: t("common.overview"), href: "/" }, { label: t("explorer.title") }]}
      actions={user && <Button variant="outline" onClick={() => saveAnalysis.mutate()} disabled={saveAnalysis.isPending}>{saveAnalysis.isSuccess ? t("explorer.saved") : saveAnalysis.isPending ? t("explorer.saving") : t("explorer.save")}</Button>}
      metadata={<><DatasetVersionBadge version={overview.data?.meta.dataset_version} /><DataFreshnessBadge year={overview.data?.meta.source_period_end} /></>} />
    <FilterBar><form onSubmit={apply}><FilterSection>
      <Filter label={t("explorer.importer")}><Select value={draft.importer ?? ""} onChange={event => setDraft(value => ({ ...value, importer: event.target.value }))}><option value="">{t("explorer.allImporters")}</option>{countries.data?.results.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</Select></Filter>
      <Filter label={t("explorer.exporter")}><Select value={draft.exporter ?? ""} onChange={event => setDraft(value => ({ ...value, exporter: event.target.value }))}><option value="">{t("explorer.allExporters")}</option>{countries.data?.results.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</Select></Filter>
      <Filter label={t("explorer.product")}><Input value={draft.product ?? ""} onChange={event => setDraft(value => ({ ...value, product: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="HS2, HS4 or HS6" inputMode="numeric" /></Filter>
      <Filter label={t("explorer.startYear")}><Input type="number" min="1900" max="2100" value={draft.start_year ?? ""} onChange={event => setDraft(value => ({ ...value, start_year: event.target.value }))} /></Filter>
      <Filter label={t("explorer.endYear")}><Input type="number" min="1900" max="2100" value={draft.end_year ?? ""} onChange={event => setDraft(value => ({ ...value, end_year: event.target.value }))} /></Filter>
    </FilterSection><div className="mt-4 flex flex-wrap items-center gap-2"><Button>{t("common.apply")}</Button><Button type="button" variant="ghost" onClick={reset}>{t("common.reset")}</Button>{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <Badge variant="secondary" key={key}>{key.replace("_", " ")}: {value}</Badge>)}</div></form></FilterBar>
    <div aria-live="polite" className="mt-8">{failed ? <ErrorState description={t("explorer.error")} /> : loading ? <LoadingSkeleton rows={4} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={BarChart3} label={t("explorer.tradeValue")} value={money.format(overview.data?.data.total_trade_value_usd ?? 0)} />
        <KpiCard icon={Boxes} label={t("explorer.quantity")} value={`${number.format(overview.data?.data.total_quantity_tons ?? 0)} t`} detail={t("explorer.quantityDetail")} />
        <KpiCard icon={Globe2} label={t("explorer.relationships")} value={String(overview.data?.data.partner_count ?? 0)} />
        <KpiCard icon={TrendingUp} label={t("explorer.yoy")} value={overview.data?.data.yoy_change_percent == null ? "—" : `${overview.data.data.yoy_change_percent.toFixed(1)}%`} />
      </div>
      <div className="mt-6"><ChartCard title={metric === "trade_value_usd" ? t("explorer.annualTitle") : t("explorer.quantityTrend")} description={metric === "trade_value_usd" ? t("explorer.annualDescription") : t("explorer.quantityDescription")} summary={t("explorer.interactiveHint")}>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={t("explorer.metric")}>
          <Button size="sm" variant={metric === "trade_value_usd" ? "default" : "outline"} onClick={() => setMetric("trade_value_usd")}>{t("explorer.tradeValue")}</Button>
          <Button size="sm" variant={metric === "quantity_tons" ? "default" : "outline"} onClick={() => setMetric("quantity_tons")}>{t("explorer.quantity")}</Button>
        </div>
        {timeseries.data?.data.length ? <EChart option={chartOption} ariaLabel={metric === "trade_value_usd" ? t("explorer.annualTitle") : t("explorer.quantityTrend")} /> : <EmptyState description={t("explorer.adjust")} />}
      </ChartCard></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Ranking title={t("explorer.topPartners")} caption={t("explorer.topPartnersCaption")} nameLabel={t("explorer.name")} valueLabel={t("explorer.tradeValue")} rows={(partners.data?.data ?? []).map(row => ({ id: row.iso3, label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd ?? 0) }))} />
        <Ranking title={t("explorer.topProducts")} caption={t("explorer.topProductsCaption")} nameLabel={t("explorer.name")} valueLabel={t("explorer.tradeValue")} rows={(products.data?.data ?? []).map(row => ({ id: row.code, label: `${row.code} · ${row.name}`, value: money.format(row.trade_value_usd ?? 0) }))} />
      </div>
      <section className="mt-8 border-t pt-6"><h2 className="font-semibold">{t("explorer.howToRead")}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{t("explorer.methodNote")}</p></section>
    </>}</div>
  </PageContainer>
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <Label className="block space-y-2"><span className="block">{label}</span>{children}</Label> }
function Ranking({ title, caption, nameLabel, valueLabel, rows }: { title: string; caption: string; nameLabel: string; valueLabel: string; rows: { id: string; label: string; value: string }[] }) {
  return <section className="overflow-hidden rounded-xl border bg-card"><div className="p-5"><h2 className="font-medium">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div>
    {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><caption className="sr-only">{caption}</caption><thead className="bg-muted/60 text-left text-muted-foreground"><tr><th scope="col" className="px-5 py-3">{nameLabel}</th><th scope="col" className="px-5 py-3 text-right">{valueLabel}</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><th scope="row" className="px-5 py-4 text-left font-normal">{row.label}</th><td className="px-5 py-4 text-right font-mono">{row.value}</td></tr>)}</tbody></table></div> : <div className="p-4"><EmptyState description="No rows match the current filters." /></div>}
  </section>
}
