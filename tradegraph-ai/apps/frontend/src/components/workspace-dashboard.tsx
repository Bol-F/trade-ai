"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { workspaceApi } from "@/lib/api"

export function WorkspaceDashboard() {
  const queryClient = useQueryClient()
  const [watchName, setWatchName] = useState("Uzbekistan · HS 01")
  const { user, isLoading } = useAuth()
  const query = useQuery({ queryKey: ["workspace"], queryFn: workspaceApi.get, enabled: Boolean(user) })
  const watchlist = useMutation({ mutationFn: () => workspaceApi.addWatchlist({ name: watchName, importer: "UZB", product: "01", start_year: 2020, end_year: 2024 }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }) })
  const exportMutation = useMutation({ mutationFn: ({ id, format }: { id: string; format: "csv" | "json" | "html" }) => workspaceApi.createExport(id, format), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }) })
  if (isLoading || query.isLoading) return <PageContainer className="py-10"><LoadingSkeleton rows={5} /></PageContainer>
  if (!user) return <PageContainer className="py-16"><ErrorState title="Sign in to open your workspace" description="Workspace items are private to your account." /></PageContainer>
  if (query.isError || !query.data) return <PageContainer className="py-16"><ErrorState title="Workspace unavailable" description="Your private workspace could not be loaded. Try again shortly." /></PageContainer>
  const data = query.data
  return <PageContainer className="py-10">
    <PageHeader eyebrow="Private analyst workspace" title="Workspace" description="Saved analyses, watchlists, favorites, comparisons, and recent exports belonging only to your account." breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Workspace" }]} actions={<Link href="/compare" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New comparison</Link>} />
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <WorkspaceSection title="Recent analyses">{data.recent_analyses.length ? data.recent_analyses.map(item => <div key={item.id}><Item title={item.title} meta={item.visualization} href="/explorer" /><div className="mt-2 flex flex-wrap gap-2">{(["csv", "json", "html"] as const).map(format => <Button key={format} size="sm" variant="outline" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate({ id: item.id, format })}>Export {format.toUpperCase()}</Button>)}</div></div>) : <EmptyState title="No saved analyses" description="Save a view from Explorer to return to it here." />}</WorkspaceSection>
      <WorkspaceSection title="Watchlist"><form className="mb-4 flex gap-2" onSubmit={event => { event.preventDefault(); watchlist.mutate() }}><label className="sr-only" htmlFor="watch-name">Watchlist name</label><input id="watch-name" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={watchName} onChange={event => setWatchName(event.target.value)} /><Button disabled={watchlist.isPending}>Add watchlist</Button></form>{data.watchlist_items.length ? data.watchlist_items.map(item => <Item key={item.id} title={item.name} meta={`${item.importer}${item.exporter ? ` · ${item.exporter}` : ""} · HS ${item.product} · ${item.start_year}–${item.end_year}`} href={`/explorer?importer=${item.importer}&exporter=${item.exporter}&product=${item.product}&start_year=${item.start_year}&end_year=${item.end_year}`} />) : <EmptyState title="No watchlist items" description="Add a market combination to monitor it here." />}</WorkspaceSection>
      <WorkspaceSection title="Favorites">{data.favorites.length ? data.favorites.map(item => <Item key={item.id} title={item.label} meta={item.kind} href={`/${item.kind === "country" ? "countries" : "products"}/${item.code}`} />) : <EmptyState title="No favorites" description="Favorite countries and products appear here." />}</WorkspaceSection>
      <WorkspaceSection title="Saved comparisons">{data.saved_comparisons.length ? data.saved_comparisons.map(item => <Item key={item.id} title={item.name} meta={`HS ${item.product} · ${item.start_year}–${item.end_year}`} href={`/compare?countries=${item.countries.join(",")}&suppliers=${item.suppliers.join(",")}&product=${item.product}&start_year=${item.start_year}&end_year=${item.end_year}`} />) : <EmptyState title="No comparisons" description="Compare two to four markets and save the result." />}</WorkspaceSection>
      <WorkspaceSection title="Recent exports">{data.recent_exports.length ? data.recent_exports.map(item => <Item key={item.id} title={`${item.format.toUpperCase()} export`} meta={item.status} href={item.status === "ready" ? workspaceApi.exportDownloadUrl(item.id) : undefined} />) : <EmptyState title="No exports" description="Generated reports will appear here until they expire." />}</WorkspaceSection>
    </div>
  </PageContainer>
}

function WorkspaceSection({ title, children }: { title: string; children: React.ReactNode }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card> }
function Item({ title, meta, href }: { title: string; meta: string; href?: string }) {
  const content = <div className="flex items-center justify-between gap-4 rounded-lg border p-3"><span className="font-medium">{title}</span><Badge variant="secondary">{meta}</Badge></div>
  return href ? <Link href={href}>{content}</Link> : content
}
