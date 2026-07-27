"use client";

import { useMemo } from "react";
import {
  Activity,
  Banknote,
  BrainCircuit,
  CircleDollarSign,
  Gauge,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  ConfidenceIndicator,
  RiskIndicator,
  StatusBadge,
} from "@/components/design-system";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EChart } from "@/components/echarts";
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
import {
  allocation,
  marketOverview,
  overviewMetrics,
  performanceSeries,
  signals,
  watchlistAssets,
} from "@/lib/dashboard-demo-data";
import { dataVisualizationTokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const metricIcons = [WalletCards, CircleDollarSign, TrendingUp, Banknote];

export function DashboardOverview() {
  const chartOption = useMemo(
    () => ({
      animationDuration: 200,
      grid: { left: 18, right: 16, top: 20, bottom: 28, containLabel: true },
      tooltip: {
        trigger: "axis" as const,
        valueFormatter: (value: unknown) =>
          `$${Number(value).toLocaleString()}`,
      },
      xAxis: {
        type: "category" as const,
        data: performanceSeries.map((_, index) => `Day ${index + 1}`),
        boundaryGap: false,
        axisLabel: { color: dataVisualizationTokens.neutral },
        axisLine: { lineStyle: { color: dataVisualizationTokens.grid } },
      },
      yAxis: {
        type: "value" as const,
        scale: true,
        axisLabel: {
          color: dataVisualizationTokens.neutral,
          formatter: (value: number) => `$${Math.round(value / 1000)}k`,
        },
        splitLine: { lineStyle: { color: dataVisualizationTokens.grid } },
      },
      series: [
        {
          type: "line" as const,
          data: performanceSeries,
          smooth: true,
          symbol: "none",
          lineStyle: { color: dataVisualizationTokens.primary, width: 3 },
          areaStyle: { color: dataVisualizationTokens.primary, opacity: 0.1 },
        },
      ],
    }),
    [],
  );

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description="A consolidated view of illustrative portfolio performance, market conditions, analytical signals, and risk."
      />
      <section
        aria-label="Portfolio metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {overviewMetrics.map((metric, index) => {
          const Icon = metricIcons[index];
          return (
            <Card key={metric.label} className="gap-0 py-0 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{metric.label}</span>
                  <Icon aria-hidden="true" className="size-4" />
                </div>
                <p
                  className="mt-5 font-mono text-2xl font-semibold"
                  data-financial-value="true"
                >
                  {metric.value}
                </p>
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-medium",
                    metric.direction === "up"
                      ? "text-success"
                      : "text-muted-foreground",
                  )}
                >
                  {metric.direction === "up" && (
                    <TrendingUp aria-hidden="true" className="size-3.5" />
                  )}
                  <span>{metric.change}</span>
                  <span className="font-normal text-muted-foreground">
                    {metric.period}
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_.8fr]">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Portfolio performance</CardTitle>
              <Badge variant="secondary">30 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <EChart
              option={chartOption}
              ariaLabel="Illustrative 30-day portfolio performance chart"
            />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Gauge aria-hidden="true" className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Portfolio risk</h2>
              </div>
              <RiskIndicator score={36} />
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Diversification score: 74/100. Technology remains the largest
                concentration.
              </p>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <BrainCircuit
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                <h2 className="text-sm font-semibold">AI confidence</h2>
              </div>
              <ConfidenceIndicator value={76} />
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active signals</span>
                <span className="font-mono font-semibold">
                  {signals.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Portfolio allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allocation.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs">
                  <span>{item.name}</span>
                  <span className="font-mono">{item.value}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Market overview</CardTitle>
              <StatusBadge tone="success">Market open</StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {marketOverview.map((market) => (
              <div
                key={market.ticker}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-medium">{market.ticker}</span>
                <div className="text-right">
                  <p className="font-mono">{market.value}</p>
                  <p
                    className={
                      market.direction === "up"
                        ? "text-xs text-success"
                        : "text-xs text-destructive"
                    }
                  >
                    {market.change}{" "}
                    <span className="sr-only">
                      {market.direction === "up" ? "increase" : "decrease"}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Recent alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Activity
                aria-hidden="true"
                className="mt-0.5 size-4 text-warning"
              />
              <div>
                <p className="text-sm font-medium">Risk threshold changed</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  EUR/USD · 12 min ago
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp
                aria-hidden="true"
                className="mt-0.5 size-4 text-success"
              />
              <div>
                <p className="text-sm font-medium">NVDA signal strengthened</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confidence reached 84% · 26 min ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="mt-4 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Watchlist summary</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="pl-6">Asset</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="pr-6 text-right">Daily change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlistAssets.slice(0, 4).map((asset) => (
                <TableRow key={asset.ticker}>
                  <TableCell className="pl-6">
                    <p className="font-medium">{asset.asset}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {asset.ticker}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.signal}</Badge>
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    ${asset.price.toLocaleString()}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className={cn(
                      "pr-6 text-right font-mono",
                      asset.change >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(1)}%{" "}
                    <span className="sr-only">
                      {asset.change >= 0 ? "increase" : "decrease"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
