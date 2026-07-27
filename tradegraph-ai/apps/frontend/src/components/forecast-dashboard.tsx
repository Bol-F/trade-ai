"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { AlertTriangle, GitCompareArrows, LineChart } from "lucide-react";
import {
  ChartCard,
  DataFreshnessBadge,
  DatasetVersionBadge,
  ErrorState,
  FilterBar,
  FilterSection,
  KpiCard,
  MetricExplanation,
  PageHeader,
} from "@/components/design-system";
import { EChart } from "@/components/echarts";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mlApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function ForecastDashboard() {
  const { t } = useI18n();
  const [importer, setImporter] = useState("CHN");
  const [exporter, setExporter] = useState("UZB");
  const [hs2, setHs2] = useState("01");
  const [year, setYear] = useState("2025");
  const mutation = useMutation({ mutationFn: mlApi.forecast });
  const result = mutation.data;
  const option: EChartsOption | undefined = result
    ? {
        tooltip: { trigger: "axis" },
        legend: {
          data: ["Historical observations", "Naive baseline", "Active model"],
        },
        xAxis: {
          type: "category",
          name: "Year",
          data: [
            ...result.historical_values.map((point) => point.year),
            result.forecast.year,
          ],
        },
        yAxis: { type: "value", name: "Trade value (USD)" },
        series: [
          {
            name: "Historical observations",
            type: "line",
            symbolSize: 8,
            data: [
              ...result.historical_values.map((point) => point.value),
              null,
            ],
          },
          {
            name: "Naive baseline",
            type: "scatter",
            symbolSize: 12,
            data: [
              ...result.historical_values.map(() => null),
              result.baseline_forecast,
            ],
          },
          {
            name: "Active model",
            type: "scatter",
            symbol: "diamond",
            symbolSize: 14,
            data: [
              ...result.historical_values.map(() => null),
              result.forecast.value,
            ],
          },
        ],
      }
    : undefined;

  return (
    <PageContainer className="py-10">
      <PageHeader
        eyebrow={t("forecast.eyebrow")}
        title={t("forecast.title")}
        description={t("forecast.description")}
        breadcrumbs={[
          { label: t("common.overview"), href: "/" },
          { label: t("forecast.title") },
        ]}
        metadata={
          result && (
            <>
              <DatasetVersionBadge version={result.dataset_version} />
              <DataFreshnessBadge year={result.data_freshness} />
            </>
          )
        }
      />
      <FilterBar title={t("forecast.definition")}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ importer, exporter, hs2, year: Number(year) });
          }}
        >
          <FilterSection>
            <Label>
              {t("forecast.importer")}
              <Input
                className="mt-2"
                maxLength={3}
                value={importer}
                onChange={(event) =>
                  setImporter(event.target.value.toUpperCase())
                }
              />
            </Label>
            <Label>
              {t("forecast.exporter")}
              <Input
                className="mt-2"
                maxLength={3}
                value={exporter}
                onChange={(event) =>
                  setExporter(event.target.value.toUpperCase())
                }
              />
            </Label>
            <Label>
              {t("forecast.product")}
              <Input
                className="mt-2"
                maxLength={2}
                value={hs2}
                onChange={(event) =>
                  setHs2(event.target.value.replace(/\D/g, ""))
                }
              />
            </Label>
            <Label>
              {t("forecast.year")}
              <Input
                className="mt-2"
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </Label>
            <Button className="self-end" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("forecast.calculating")
                : t("forecast.run")}
            </Button>
          </FilterSection>
        </form>
      </FilterBar>
      {mutation.isError && (
        <div className="mt-6">
          <ErrorState
            title={t("forecast.errorTitle")}
            description={t("forecast.error")}
          />
        </div>
      )}
      {result && option && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={LineChart}
              label={t("forecast.model")}
              value={money(result.forecast.value)}
              detail={t("forecast.estimate", { year: result.forecast.year })}
            />
            <KpiCard
              icon={GitCompareArrows}
              label={t("forecast.baseline")}
              value={money(result.baseline_forecast)}
              detail={t("forecast.baselineDetail")}
            />
            <KpiCard
              label={t("forecast.difference")}
              value={percentDifference(
                result.forecast.value,
                result.baseline_forecast,
              )}
              detail={t("forecast.baseline")}
            />
          </div>
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning-surface p-4 text-sm">
            <p className="font-medium">
              Approximate {Math.round(result.forecast.coverage_level * 100)}%
              prediction interval
            </p>
            <p className="mt-1 font-mono">
              {money(result.forecast.lower_bound)} –{" "}
              {money(result.forecast.upper_bound)}
            </p>
            <p className="mt-2 text-muted-foreground">
              This interval is uncertain, not guaranteed. Method:{" "}
              {result.forecast.interval_method}.
            </p>
          </div>
          {result.warnings.map((warning) => (
            <div
              role="status"
              key={warning.code}
              className="mt-3 rounded-lg border border-warning/30 bg-warning-surface p-3 text-sm"
            >
              <strong>{warning.code.replaceAll("_", " ")}:</strong>{" "}
              {warning.message}
            </div>
          ))}
          <div className="mt-6">
            <ChartCard
              title="Observed and estimated trade value"
              description="Historical values are observations; the two final markers are alternative estimates."
              summary={`${result.historical_values.length} historical observations. The model estimate is ${money(result.forecast.value)} and baseline is ${money(result.baseline_forecast)}.`}
            >
              <EChart
                option={option}
                ariaLabel="Historical trade values with naive baseline and active-model forecast"
              />
            </ChartCard>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Model identity</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <MetricExplanation term="Model">
                    {result.model_name}
                  </MetricExplanation>
                  <MetricExplanation term="Version">
                    <span className="font-mono">{result.model_version}</span>
                  </MetricExplanation>
                  <MetricExplanation term="Training period">
                    {formatPeriod(result.training_period)}
                  </MetricExplanation>
                  <MetricExplanation term="Dataset">
                    <span className="font-mono">{result.dataset_version}</span>
                  </MetricExplanation>
                </dl>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Evidence and factors</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">
                  {Object.keys(result.metrics).length
                    ? "Validation and held-out test metrics are retained in the model registry."
                    : "No trained-model report is available; this result uses the retained baseline."}
                </p>
                <h3 className="mt-5 font-medium">Why this result</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.explanations.map((explanation) => (
                    <li key={explanation}>{explanation}</li>
                  ))}
                </ul>
                <p className="mt-4 font-medium">
                  {result.used_fallback
                    ? "Quality fallback baseline"
                    : "Active production model"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-warning-surface shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning" />
                  Uncertainty and limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                The interval is estimated from validation residuals and cannot
                anticipate policy changes, conflict, weather, reporting
                revisions, or structural breaks. Compare the forecast with the
                baseline and investigate the historical lane.
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {result.factor_definitions.map((factor) => (
              <div
                key={factor.feature}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="font-medium">{factor.display_name}</p>
                <p className="mt-1 text-muted-foreground">
                  {factor.description} {factor.direction}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Limitation: {factor.limitation}
                </p>
              </div>
            ))}
          </div>
          <Card className="mt-6 shadow-none">
            <CardHeader>
              <CardTitle>Prediction lineage</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <MetricExplanation term="Data source">
                  {result.lineage.data_source}
                </MetricExplanation>
                <MetricExplanation term="Feature dataset">
                  {result.lineage.feature_dataset_version}
                </MetricExplanation>
                <MetricExplanation term="Feature schema">
                  {result.lineage.feature_schema_version}
                </MetricExplanation>
                <MetricExplanation term="Inference time">
                  {new Date(
                    result.lineage.inference_timestamp,
                  ).toLocaleString()}
                </MetricExplanation>
              </dl>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(value);
}
function percentDifference(value: number, baseline: number) {
  return baseline
    ? `${(((value - baseline) / baseline) * 100).toFixed(1)}%`
    : "Unavailable";
}
function formatPeriod(period: Record<string, unknown>) {
  return period.start && period.end
    ? `${String(period.start)}–${String(period.end)}`
    : "Not reported";
}
