"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/components/auth-provider"
import { PageContainer } from "@/components/page-container"
import { adminApi } from "@/lib/api"

export function DataHealthDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const query = useQuery({
    queryKey: ["admin-data-health"],
    queryFn: adminApi.dataHealth,
    enabled: user?.role === "admin",
  })
  if (authLoading) return <PageContainer className="py-16"><div className="h-72 animate-pulse rounded-xl bg-muted" /></PageContainer>
  if (!user || user.role !== "admin") return <PageContainer className="py-20"><h1 className="text-3xl font-semibold">Administrator access required</h1><p className="mt-3 text-muted-foreground">This operational view is restricted to administrators.</p></PageContainer>
  if (query.isLoading) return <PageContainer className="py-16"><div className="h-72 animate-pulse rounded-xl bg-muted" /></PageContainer>
  if (!query.data) return <PageContainer className="py-20"><h1 className="text-3xl font-semibold">Data health unavailable</h1></PageContainer>
  const data = query.data
  return <PageContainer className="py-10">
    <p className="font-mono text-sm text-primary">Admin operations</p><h1 className="mt-2 text-4xl font-semibold">Data health</h1>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Metric label="Active dataset" value={data.active_dataset?.version ?? "None"} />
      <Metric label="Rows" value={(data.active_dataset?.row_count ?? 0).toLocaleString()} />
      <Metric label="Fresh through" value={String(data.data_freshness ?? "—")} />
      <Metric label="Active models" value={String(data.active_models)} />
      <Metric label="Cache" value={data.cache_status} />
    </div>
    <Section title="Dataset versions"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Version</th><th>Status</th><th>Coverage</th><th>Rows</th><th>Active</th></tr></thead><tbody>{data.versions.map((row) => <tr key={`${row.source}-${row.version}`} className="border-t"><td className="p-3 font-mono">{row.source} / {row.version}</td><td>{row.status}</td><td>{row.period_start}–{row.period_end}</td><td>{row.row_count.toLocaleString()}</td><td>{row.is_active ? "Yes" : "No"}</td></tr>)}</tbody></table></Section>
    <Section title={`Ingestion runs · ${data.failures} failures`}><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Started</th><th>Dataset</th><th>Task</th><th>Status</th><th>Read / written</th><th>Error</th></tr></thead><tbody>{data.ingestion_runs.map((row) => <tr key={row.id} className="border-t"><td className="p-3">{new Date(row.started_at).toLocaleString()}</td><td>{row.dataset_version__version}</td><td>{row.task_name}</td><td>{row.status}</td><td>{row.records_read} / {row.records_written}</td><td className="max-w-64 truncate text-destructive">{row.error_message || "—"}</td></tr>)}</tbody></table></Section>
    <Section title="Model versions"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Model</th><th>Task</th><th>Dataset</th><th>Status</th></tr></thead><tbody>{data.models.map((row) => <tr key={`${row.model_name}-${row.model_version}`} className="border-t"><td className="p-3 font-mono">{row.model_name}:{row.model_version}</td><td>{row.task_type}</td><td>{row.dataset_version__version}</td><td>{row.status}</td></tr>)}</tbody></table></Section>
  </PageContainer>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-2 font-mono text-xl font-semibold">{value}</p></div> }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-6 overflow-x-auto rounded-xl border bg-card"><h2 className="p-4 font-semibold">{title}</h2>{children}</section> }
