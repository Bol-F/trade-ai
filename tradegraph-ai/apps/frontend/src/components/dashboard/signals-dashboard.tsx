"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, Search, ShieldAlert } from "lucide-react"

import { ConfidenceIndicator, StatusBadge } from "@/components/design-system"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationNext, PaginationPrevious, PaginationStatus } from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type DashboardSignal, type RiskLevel, type SignalType, signals } from "@/lib/dashboard-demo-data"
import { cn } from "@/lib/utils"

const pageSize = 4

function signalTone(type: SignalType) {
  if (type === "Bullish") return "success" as const
  if (type === "Bearish") return "danger" as const
  if (type === "Watch") return "warning" as const
  return "neutral" as const
}

export function SignalsDashboard() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<SignalType | "All">("All")
  const [risk, setRisk] = useState<RiskLevel | "All">("All")
  const [sort, setSort] = useState<"confidence" | "recent">("confidence")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DashboardSignal | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return signals
      .filter((signal) => !query || signal.asset.toLowerCase().includes(query) || signal.ticker.toLowerCase().includes(query))
      .filter((signal) => type === "All" || signal.type === type)
      .filter((signal) => risk === "All" || signal.risk === risk)
      .sort((a, b) => sort === "confidence" ? b.confidence - a.confidence : signals.indexOf(a) - signals.indexOf(b))
  }, [risk, search, sort, type])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize)

  function resetPage() {
    setPage(1)
  }

  return (
    <>
      <DashboardPageHeader title="AI Signals" description="Review structured, explainable market signals with visible confidence, risk, horizon, and supporting context." />
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(9rem,.35fr))]">
            <label className="relative"><span className="sr-only">Search signals</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} className="pl-9" placeholder="Search asset or ticker…" /></label>
            <label><span className="sr-only">Signal type</span><Select value={type} onChange={(event) => { setType(event.target.value as SignalType | "All"); resetPage() }}><option>All</option><option>Bullish</option><option>Bearish</option><option>Neutral</option><option>Watch</option></Select></label>
            <label><span className="sr-only">Risk level</span><Select value={risk} onChange={(event) => { setRisk(event.target.value as RiskLevel | "All"); resetPage() }}><option>All</option><option>Low</option><option>Medium</option><option>High</option></Select></label>
            <label><span className="sr-only">Sort signals</span><Select value={sort} onChange={(event) => setSort(event.target.value as "confidence" | "recent")}><option value="confidence">Highest confidence</option><option value="recent">Most recent</option></Select></label>
          </div>
        </CardContent>
      </Card>
      <div role="note" className="mt-4 flex gap-3 rounded-xl border border-warning/30 bg-warning-surface p-4 text-sm">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
        <p><strong>Analytical signal—not financial advice.</strong> Signals use illustrative demo data, carry uncertainty, and do not guarantee price direction or performance.</p>
      </div>
      <Card className="mt-4 shadow-none">
        {visible.length ? <><Table><TableHeader><TableRow><TableHead className="pl-5">Asset</TableHead><TableHead>Signal</TableHead><TableHead className="text-right">Price</TableHead><TableHead>Target</TableHead><TableHead>Confidence</TableHead><TableHead>Risk / horizon</TableHead><TableHead className="pr-5 text-right"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>{visible.map((signal) => <TableRow key={signal.id} tabIndex={0}><TableCell className="pl-5"><p className="font-medium">{signal.asset}</p><p className="font-mono text-xs text-muted-foreground">{signal.ticker} · {signal.createdAt}</p></TableCell><TableCell><StatusBadge tone={signalTone(signal.type)}>{signal.type}</StatusBadge></TableCell><TableCell data-numeric="true" className="text-right font-mono">${signal.price.toLocaleString()}</TableCell><TableCell className="font-mono text-xs">{signal.target}</TableCell><TableCell className="min-w-36"><ConfidenceIndicator value={signal.confidence} label="Confidence" /></TableCell><TableCell><Badge variant="outline" className={cn(signal.risk === "High" && "border-destructive/30 text-destructive", signal.risk === "Low" && "border-success/30 text-success")}>{signal.risk}</Badge><p className="mt-1 text-xs text-muted-foreground">{signal.horizon}</p></TableCell><TableCell className="pr-5 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(signal)}>Details</Button></TableCell></TableRow>)}</TableBody>
        </Table><div className="border-t p-4"><Pagination><PaginationPrevious disabled={page <= 1} onClick={() => setPage((current) => current - 1)} /><PaginationStatus page={Math.min(page, totalPages)} totalPages={totalPages} /><PaginationNext disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} /></Pagination></div></> : <div className="p-10 text-center"><ArrowUpDown aria-hidden="true" className="mx-auto size-6 text-muted-foreground" /><h2 className="mt-4 font-medium">No matching signals</h2><p className="mt-2 text-sm text-muted-foreground">Adjust the search or filters to review other demo signals.</p></div>}
      </Card>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && <><DialogHeader><DialogTitle>{selected.asset} · {selected.ticker}</DialogTitle><DialogDescription>Created {selected.createdAt} · {selected.horizon} horizon</DialogDescription></DialogHeader>
            <div className="flex flex-wrap gap-2"><StatusBadge tone={signalTone(selected.type)}>{selected.type}</StatusBadge><Badge variant="outline">{selected.risk} risk</Badge><Badge variant="secondary">{selected.target} target range</Badge></div>
            <ConfidenceIndicator value={selected.confidence} />
            <div className="rounded-lg bg-muted/50 p-4"><h3 className="text-sm font-medium">AI analysis summary</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.summary}</p></div>
            <p className="text-xs leading-5 text-muted-foreground">This demo signal is not a recommendation or guarantee. Validate market data and consult a qualified professional where appropriate.</p>
          </>}
        </DialogContent>
      </Dialog>
    </>
  )
}
