"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import {
  DataFreshnessBadge,
  DatasetVersionBadge,
  ErrorState,
  KpiCard,
  LoadingSkeleton,
  PageHeader,
} from "@/components/design-system";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { catalogApi, datasetsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { queryKeys } from "@/lib/query-options";

export function OverviewPage() {
  const { t } = useI18n();
  const countries = useQuery({
    queryKey: queryKeys.countries(),
    queryFn: () => catalogApi.countries(""),
  });
  const products = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => catalogApi.products(""),
  });
  const sources = useQuery({
    queryKey: ["data-sources"],
    queryFn: datasetsApi.sources,
  });
  const loading =
    countries.isLoading || products.isLoading || sources.isLoading;
  const failed = countries.isError || products.isError || sources.isError;
  const meta = sources.data?.meta;
  const source = sources.data?.data[0];
  const questions = [
    t("overview.question1"),
    t("overview.question2"),
    t("overview.question3"),
    t("overview.question4"),
  ];

  return (
    <PageContainer className="py-10 sm:py-14">
      <PageHeader
        eyebrow={t("overview.eyebrow")}
        title={t("overview.title")}
        description={t("overview.description")}
        actions={
          <>
            <Button asChild>
              <Link href="/explorer">
                {t("overview.openExplorer")} <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/explorer?importer=UZB&product=10">
                {t("overview.example")}
              </Link>
            </Button>
          </>
        }
        metadata={
          <>
            <DatasetVersionBadge version={meta?.dataset_version} />
            <DataFreshnessBadge year={meta?.source_period_end} />
          </>
        }
      />
      {loading ? (
        <div className="mt-8">
          <LoadingSkeleton rows={3} />
        </div>
      ) : failed ? (
        <div className="mt-8">
          <ErrorState description={t("overview.loadError")} />
        </div>
      ) : (
        <>
          <section aria-labelledby="coverage-title" className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 id="coverage-title" className="text-lg font-semibold">
                  {t("overview.coverage")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("overview.coverageHelp")}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Globe2}
                label={t("overview.countries")}
                value={(countries.data?.count ?? 0).toLocaleString()}
              />
              <KpiCard
                icon={Boxes}
                label={t("overview.products")}
                value={(products.data?.count ?? 0).toLocaleString()}
              />
              <KpiCard
                icon={BarChart3}
                label={t("overview.coverageThrough")}
                value={String(meta?.source_period_end ?? "—")}
              />
              <KpiCard
                icon={ShieldCheck}
                label={t("overview.activeSource")}
                value={source?.code ?? "—"}
                detail={source?.name}
              />
            </div>
          </section>
          <section
            aria-labelledby="questions-title"
            className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"
          >
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle id="questions-title">
                  {t("overview.questions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {questions.map((question) => (
                  <div
                    key={question}
                    className="rounded-lg bg-muted/55 p-4 text-sm leading-6"
                  >
                    {question}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-primary/25 bg-primary/[0.035] shadow-none">
              <CardHeader>
                <CardTitle>{t("overview.decisionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>{t("overview.decisionText")}</p>
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  {t("overview.reviewMethodology")}{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </PageContainer>
  );
}
