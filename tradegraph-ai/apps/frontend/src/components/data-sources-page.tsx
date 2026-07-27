"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DataFreshnessBadge,
  DatasetVersionBadge,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from "@/components/design-system";
import { PageContainer } from "@/components/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { datasetsApi } from "@/lib/api";

export function DataSourcesPage() {
  const query = useQuery({
    queryKey: ["data-sources"],
    queryFn: datasetsApi.sources,
  });
  return (
    <PageContainer className="py-10">
      <PageHeader
        eyebrow="Provenance"
        title="Data sources"
        description="Review licensing, classification, validation, coverage, and annual-data freshness. Annual trade data is not real-time."
        breadcrumbs={[
          { label: "Overview", href: "/" },
          { label: "Data Sources" },
        ]}
        metadata={
          <>
            <DatasetVersionBadge version={query.data?.meta.dataset_version} />
            <DataFreshnessBadge year={query.data?.meta.source_period_end} />
          </>
        }
      />
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState description="Data-source provenance could not be loaded." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {query.data?.data.map((source) => (
              <Card key={source.code}>
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-primary">
                      {source.code}
                    </p>
                    <CardTitle className="mt-2">{source.name}</CardTitle>
                  </div>
                  <Badge>
                    {source.active_dataset?.freshness_label ?? "Unknown"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>License: {source.license_name || "See source terms"}</p>
                  {source.active_dataset ? (
                    <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                      <Field
                        term="Dataset"
                        value={source.active_dataset.version}
                      />
                      <Field
                        term="Classification"
                        value={source.active_dataset.classification}
                      />
                      <Field
                        term="Coverage"
                        value={`${source.active_dataset.period_start}–${source.active_dataset.period_end}`}
                      />
                      <Field
                        term="Rows"
                        value={source.active_dataset.row_count.toLocaleString()}
                      />
                      <Field
                        term="Validation"
                        value={source.active_dataset.validation_status}
                      />
                      <Field
                        term="Imported"
                        value={new Date(
                          source.active_dataset.imported_at,
                        ).toLocaleDateString()}
                      />
                      <Field
                        term="Attribution"
                        value={source.active_dataset.attribution}
                      />
                    </dl>
                  ) : (
                    <p>No active validated dataset.</p>
                  )}
                  <p>
                    <strong>Freshness rules:</strong> Current = through last
                    year; Delayed = two years behind; Stale = older; Incomplete
                    = unvalidated or empty; Unknown = no active version.
                  </p>
                  {source.homepage && (
                    <a
                      className="inline-block text-foreground underline"
                      href={source.homepage}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Source homepage
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
function Field({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
