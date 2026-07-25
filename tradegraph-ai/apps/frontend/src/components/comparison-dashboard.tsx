"use client"

import { useMemo, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { ErrorState, KpiCard, PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { analyticsApi } from "@/lib/api"

function validCodes(value: string | null): string[] {
  return (value ?? "").split(",").map(code => code.trim().toUpperCase()).filter(code => /^[A-Z]{3}$/.test(code)).slice(0, 4)
}
function validProduct(value: string | null) { return /^\d{2,6}$/.test(value ?? "") ? value! : "01" }
function validYear(value: string | null, fallback: number) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1962 && number <= 2200 ? number : fallback
}

export function ComparisonDashboard() {
  const params = useSearchParams()
  const router = useRouter()
  const initialCountries = validCodes(params.get("countries"))
  const [countries, setCountries] = useState(initialCountries.join(",") || "UZB,DEU")
  const [suppliers, setSuppliers] = useState(validCodes(params.get("suppliers")).join(","))
  const [product, setProduct] = useState(validProduct(params.get("product")))
  const [startYear, setStartYear] = useState(String(validYear(params.get("start_year"), 2020)))
  const [endYear, setEndYear] = useState(String(validYear(params.get("end_year"), 2024)))
  const selected = useMemo(() => validCodes(params.get("countries")), [params])
  const profiles = useQueries({ queries: selected.map(code => ({ queryKey: ["comparison-country", code], queryFn: () => analyticsApi.countryProfile(code) })) })
  const invalidCount = selected.length > 0 && (selected.length < 2 || selected.length > 4)

  function apply() {
    const countryCodes = validCodes(countries)
    const supplierCodes = validCodes(suppliers)
    if (countryCodes.length < 2) return
    const next = new URLSearchParams({
      countries: countryCodes.join(","), product: validProduct(product),
      start_year: String(validYear(startYear, 2020)), end_year: String(validYear(endYear, 2024)),
    })
    if (supplierCodes.length) next.set("suppliers", supplierCodes.join(","))
    router.push(`/compare?${next}`)
  }

  return <PageContainer className="py-10">
    <PageHeader eyebrow="Shareable comparison" title="Compare markets and suppliers" description="Compare two to four countries, optionally two to four suppliers, for one product and period. The URL contains only validated analytical filters—never account identifiers." breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Compare" }]} />
    <Card className="mt-8"><CardHeader><CardTitle>Comparison definition</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Label>Countries (ISO3)<Input className="mt-2" value={countries} onChange={event => setCountries(event.target.value)} placeholder="UZB,DEU" /></Label>
      <Label>Suppliers (optional)<Input className="mt-2" value={suppliers} onChange={event => setSuppliers(event.target.value)} placeholder="KAZ,CHN" /></Label>
      <Label>Product code<Input className="mt-2" value={product} onChange={event => setProduct(event.target.value.replace(/\D/g, "").slice(0, 6))} /></Label>
      <Label>Date range<span className="mt-2 flex gap-2"><Input aria-label="Start year" value={startYear} onChange={event => setStartYear(event.target.value)} /><Input aria-label="End year" value={endYear} onChange={event => setEndYear(event.target.value)} /></span></Label>
      <Button className="self-end" onClick={apply}>Apply comparison</Button>
    </CardContent></Card>
    {invalidCount && <div className="mt-6"><ErrorState title="Select two to four countries" description="Comparison URLs outside the supported range are not evaluated." /></div>}
    {selected.length >= 2 && <div className="mt-8 grid gap-6 xl:grid-cols-2">{profiles.map((query, index) => {
      const profile = query.data?.data
      if (query.isError) return <ErrorState key={selected[index]} title={`${selected[index]} unavailable`} description="This profile could not be compared." />
      if (!profile) return <Card key={selected[index]} className="h-64 animate-pulse bg-muted" />
      return <Card key={profile.iso3}><CardHeader><CardTitle>{profile.iso3}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Trade value" value={money(profile.total_imports_usd + profile.total_exports_usd)} />
        <KpiCard label="Growth" value={growth(profile.history)} />
        <KpiCard label="Supplier HHI" value={profile.concentration.hhi.toFixed(3)} />
        <KpiCard label="Volatility" value={profile.exposure.volatility.toFixed(3)} />
        <KpiCard label="Exposure" value={`${profile.exposure.score.toFixed(1)} / 100`} />
        <KpiCard label="Data freshness" value={String(query.data?.meta.source_period_end ?? "Unknown")} />
      </CardContent></Card>
    })}</div>}
    <p className="mt-6 text-sm text-muted-foreground">Supplier share and forecast comparisons require a fully specified bilateral lane; use Supplier Finder and Forecast for those metrics. Annual data is not real-time.</p>
  </PageContainer>
}

function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value) }
function growth(history: { value: string | number | null }[]) {
  const values = history.map(point => Number(point.value ?? 0))
  if (values.length < 2 || !values.at(-2)) return "Unknown"
  return `${(((values.at(-1)! - values.at(-2)!) / values.at(-2)!) * 100).toFixed(1)}%`
}
