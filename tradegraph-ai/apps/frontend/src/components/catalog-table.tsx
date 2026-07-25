"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { FormEvent, useState } from "react"
import { Search } from "lucide-react"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { catalogApi } from "@/lib/api"
import { queryKeys } from "@/lib/query-options"

export function CountryTable() {
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const query = useQuery({ queryKey: queryKeys.countries(search), queryFn: () => catalogApi.countries(search) })
  return <CatalogShell title="Countries" description="Search active economies by country name or ISO code." draft={draft} setDraft={setDraft} submit={() => setSearch(draft)}>
    {query.isLoading ? <LoadingRows /> : query.isError ? <ErrorState /> : query.data?.results.length === 0 ? <EmptyState /> :
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-muted/60 text-left text-muted-foreground"><tr><th className="px-4 py-3">Country</th><th className="px-4 py-3">ISO</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Subregion</th></tr></thead><tbody>{query.data?.results.map(country => <tr key={country.iso3} className="border-t hover:bg-muted/30"><td className="px-4 py-4 font-medium"><Link className="hover:underline" href={`/countries/${country.iso3}`}>{country.name}</Link></td><td className="px-4 py-4 font-mono">{country.iso3}</td><td className="px-4 py-4">{country.region || "—"}</td><td className="px-4 py-4">{country.subregion || "—"}</td></tr>)}</tbody></table></div>}
  </CatalogShell>
}

export function ProductTable() {
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const query = useQuery({ queryKey: queryKeys.products(search), queryFn: () => catalogApi.products(search) })
  return <CatalogShell title="Products" description="Search HS92 product codes and descriptions. Leading zeros are significant." draft={draft} setDraft={setDraft} submit={() => setSearch(draft)}>
    {query.isLoading ? <LoadingRows /> : query.isError ? <ErrorState /> : query.data?.results.length === 0 ? <EmptyState /> :
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-muted/60 text-left text-muted-foreground"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Parent</th></tr></thead><tbody>{query.data?.results.map(product => <tr key={product.code} className="border-t hover:bg-muted/30"><td className="px-4 py-4 font-mono font-medium"><Link className="hover:underline" href={`/products/${product.code}`}>{product.code}</Link></td><td className="px-4 py-4">{product.name}</td><td className="px-4 py-4">HS{product.level}</td><td className="px-4 py-4 font-mono">{product.parent_code || "—"}</td></tr>)}</tbody></table></div>}
  </CatalogShell>
}

function CatalogShell({ title, description, draft, setDraft, submit, children }: { title: string; description: string; draft: string; setDraft: (value: string) => void; submit: () => void; children: React.ReactNode }) {
  function onSubmit(event: FormEvent) { event.preventDefault(); submit() }
  return <PageContainer className="py-12 md:py-16"><p className="font-mono text-xs uppercase tracking-widest text-primary">Reference catalog</p><h1 className="mt-3 text-4xl font-semibold">{title}</h1><p className="mt-3 text-muted-foreground">{description}</p><form onSubmit={onSubmit} className="my-8 flex max-w-xl gap-2"><Input value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} aria-label={`Search ${title.toLowerCase()}`} /><Button><Search /> Search</Button></form>{children}</PageContainer>
}
function LoadingRows() { return <div aria-label="Loading" className="space-y-2">{[1,2,3,4].map(row => <div key={row} className="h-14 animate-pulse rounded-md bg-muted" />)}</div> }
function EmptyState() { return <div className="rounded-xl border p-10 text-center text-muted-foreground">No matching records found.</div> }
function ErrorState() { return <div role="alert" className="rounded-xl border border-destructive/30 p-6 text-destructive">The catalog could not be loaded. Confirm that the API is available.</div> }
