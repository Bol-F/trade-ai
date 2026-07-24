"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { catalogApi } from "@/lib/api"

export function CountryDetail({ iso3 }: { iso3: string }) {
  const query = useQuery({ queryKey: ["country", iso3], queryFn: () => catalogApi.country(iso3) })
  if (query.isLoading) return <DetailLoading />
  if (!query.data) return <DetailMissing back="/countries" />
  const country = query.data
  return <PageContainer className="py-12 md:py-16"><Link href="/countries" className="text-sm text-muted-foreground hover:text-foreground">← Countries</Link><p className="mt-10 font-mono text-sm text-primary">{country.iso3} · M49 {country.m49_code}</p><h1 className="mt-3 text-4xl font-semibold">{country.name}</h1><dl className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">{[["Region", country.region],["Subregion", country.subregion],["ISO-2", country.iso2],["Landlocked", country.landlocked ? "Yes" : "No"],["Latitude", country.latitude],["Longitude", country.longitude]].map(([label,value]) => <div key={String(label)} className="bg-card p-5"><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-2 font-medium">{value || "—"}</dd></div>)}</dl></PageContainer>
}

export function ProductDetail({ code }: { code: string }) {
  const query = useQuery({ queryKey: ["product", code], queryFn: () => catalogApi.product(code) })
  if (query.isLoading) return <DetailLoading />
  if (!query.data) return <DetailMissing back="/products" />
  const product = query.data
  return <PageContainer className="py-12 md:py-16"><Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">← Products</Link><p className="mt-10 font-mono text-sm text-primary">{product.classification.code}{product.classification.version} · HS{product.level}</p><h1 className="mt-3 font-mono text-4xl font-semibold">{product.code}</h1><p className="mt-5 max-w-3xl text-xl leading-8">{product.name}</p><div className="mt-10 rounded-xl border bg-card p-6"><p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p><p className="mt-3 leading-7 text-muted-foreground">{product.description || "No additional description is available."}</p>{product.parent_code && <p className="mt-6 text-sm">Parent: <Link className="font-mono underline" href={`/products/${product.parent_code}`}>{product.parent_code}</Link></p>}</div></PageContainer>
}

function DetailLoading() { return <PageContainer className="py-16"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="mt-6 h-12 w-80 animate-pulse rounded bg-muted" /><div className="mt-10 h-48 animate-pulse rounded-xl bg-muted" /></PageContainer> }
function DetailMissing({ back }: { back: string }) { return <PageContainer className="py-20 text-center"><h1 className="text-2xl font-semibold">Record not found</h1><Link href={back} className="mt-4 inline-block underline">Return to catalog</Link></PageContainer> }
