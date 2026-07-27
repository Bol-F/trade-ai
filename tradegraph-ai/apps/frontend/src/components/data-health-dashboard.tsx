"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import {
  DataFreshnessBadge,
  DatasetVersionBadge,
  ErrorState,
  KpiCard,
  LoadingSkeleton,
  PageHeader,
} from "@/components/design-system";
import { PageContainer } from "@/components/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (["failed", "error", "rejected"].includes(status.toLowerCase()))
    return "destructive";
  if (
    ["active", "completed", "ready", "success"].includes(status.toLowerCase())
  )
    return "default";
  return "secondary";
}

export function DataHealthDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ["admin-data-health"],
    queryFn: adminApi.dataHealth,
    enabled: user?.role === "admin",
  });

  if (authLoading)
    return (
      <PageContainer className="py-10">
        <LoadingSkeleton rows={5} />
      </PageContainer>
    );
  if (!user || user.role !== "admin") {
    return (
      <PageContainer className="py-16">
        <ErrorState
          title="Administrator access required"
          description="This operational view is restricted to administrators."
        />
      </PageContainer>
    );
  }
  if (query.isLoading)
    return (
      <PageContainer className="py-10">
        <LoadingSkeleton rows={5} />
      </PageContainer>
    );
  if (query.isError || !query.data) {
    return (
      <PageContainer className="py-16">
        <ErrorState
          title="Data health unavailable"
          description="Operational status could not be retrieved. Retry after checking the API."
        />
      </PageContainer>
    );
  }

  const data = query.data;
  const activeDataset = data.active_dataset;
  const health =
    data.failures > 0
      ? "Attention needed"
      : activeDataset
        ? "Operational"
        : "No active dataset";

  return (
    <PageContainer className="py-8 sm:py-10">
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: "Data health" }]}
        eyebrow="Admin operations"
        title="Data health"
        description="Dataset lifecycle, ingestion reliability, model activation, and cache status."
        metadata={
          <>
            <Badge variant={data.failures ? "destructive" : "default"}>
              {health}
            </Badge>
            {activeDataset && (
              <DatasetVersionBadge version={activeDataset.version} />
            )}
            {data.data_freshness && (
              <DataFreshnessBadge year={data.data_freshness} />
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active dataset"
          value={activeDataset?.version ?? "None"}
        />
        <KpiCard
          label="Active rows"
          value={(activeDataset?.row_count ?? 0).toLocaleString()}
        />
        <KpiCard
          label="Failed runs"
          value={String(data.failures)}
          detail={data.failures ? "Investigate" : "Healthy"}
        />
        <KpiCard label="Active models" value={String(data.active_models)} />
        <KpiCard label="Cache" value={data.cache_status} />
      </div>

      {data.failures > 0 && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Recommended action</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Review failed ingestion runs below, resolve the reported error, then
            validate and promote a healthy dataset version.
          </CardContent>
        </Card>
      )}

      <HealthTable
        title="Dataset versions"
        caption="Available dataset versions and their promotion state."
      >
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead className="text-right">Rows</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.versions.map((row) => (
            <TableRow key={`${row.source}-${row.version}`}>
              <TableCell className="font-mono">
                {row.source} / {row.version}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </TableCell>
              <TableCell>
                {row.period_start}–{row.period_end}
              </TableCell>
              <TableCell className="text-right font-mono">
                {row.row_count.toLocaleString()}
              </TableCell>
              <TableCell>
                {row.is_active ? <Badge>Active</Badge> : "No"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </HealthTable>

      <HealthTable
        title="Ingestion runs"
        caption="Recent data ingestion activity, record counts, and errors."
      >
        <TableHeader>
          <TableRow>
            <TableHead>Started</TableHead>
            <TableHead>Dataset</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              Read / written / rejected
            </TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.ingestion_runs.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(row.started_at).toLocaleString()}
              </TableCell>
              <TableCell className="font-mono">
                {row.dataset_version__version}
              </TableCell>
              <TableCell>{row.task_name}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {row.records_read} / {row.records_written} /{" "}
                {row.records_rejected}
              </TableCell>
              <TableCell className="max-w-72 text-destructive">
                {row.error_message || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </HealthTable>

      <HealthTable
        title="Model versions"
        caption="Registered analytical model versions and activation state."
      >
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Dataset</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.models.map((row) => (
            <TableRow key={`${row.model_name}-${row.model_version}`}>
              <TableCell className="font-mono">
                {row.model_name}:{row.model_version}
              </TableCell>
              <TableCell>{row.task_type}</TableCell>
              <TableCell className="font-mono">
                {row.dataset_version__version}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </TableCell>
              <TableCell>
                {new Date(row.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </HealthTable>
    </PageContainer>
  );
}

function HealthTable({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <caption className="sr-only">{caption}</caption>
          {children}
        </Table>
      </CardContent>
    </Card>
  );
}
