"use client";

import { useMemo } from "react";
import {
  Ellipsis,
  Gauge,
  PieChart,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { RiskIndicator, StatusBadge } from "@/components/design-system";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EChart } from "@/components/echarts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { holdings, performanceSeries } from "@/lib/dashboard-demo-data";
import { dataVisualizationTokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function PortfolioDashboard() {
  const option = useMemo(
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
        title="Portfolio"
        description="Inspect illustrative holdings, allocation, diversification, and risk. No brokerage account is connected."
        action={<Button variant="outline">Export demo CSV</Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total value", "$248,620.40", "+1.24%", WalletCards],
          ["Total return", "+$19,794.78", "+8.65%", TrendingUp],
          ["Daily change", "+$3,041.18", "+1.24%", TrendingUp],
          ["Diversification", "74 / 100", "Good", PieChart],
        ].map(([label, value, detail, Icon]) => (
          <Card key={String(label)} className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{String(label)}</span>
                <Icon aria-hidden="true" className="size-4" />
              </div>
              <p className="mt-5 font-mono text-2xl font-semibold">
                {String(value)}
              </p>
              <p className="mt-2 text-xs text-success">{String(detail)}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_.65fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Portfolio performance</CardTitle>
          </CardHeader>
          <CardContent>
            <EChart
              option={option}
              ariaLabel="Illustrative portfolio performance chart"
            />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge aria-hidden="true" className="size-4 text-primary" />
              Portfolio health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskIndicator score={36} />
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diversification</span>
                <StatusBadge tone="success">Good</StatusBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest position</span>
                <span className="font-mono">21.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash allocation</span>
                <span className="font-mono">13.2%</span>
              </div>
            </div>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Risk omits taxes, liquidity needs, leverage, and personal
              suitability.
            </p>
          </CardContent>
        </Card>
      </section>
      <Card className="mt-4 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Holdings</CardTitle>
            <Badge variant="outline">{holdings.length} assets</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader className="sticky top-16 z-10 bg-card">
              <TableRow>
                <TableHead className="pl-5">Asset</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Average entry</TableHead>
                <TableHead className="text-right">Current price</TableHead>
                <TableHead className="text-right">Market value</TableHead>
                <TableHead className="text-right">Profit / loss</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.ticker}>
                  <TableCell className="pl-5">
                    <p className="font-medium">{holding.asset}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {holding.ticker}
                    </p>
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    {holding.quantity}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    ${holding.average.toFixed(2)}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    ${holding.current.toFixed(2)}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    $
                    {holding.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className={cn(
                      "text-right font-mono",
                      holding.pnl >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {holding.pnl >= 0 ? (
                      <TrendingUp
                        aria-hidden="true"
                        className="mr-1 inline size-3"
                      />
                    ) : (
                      <TrendingDown
                        aria-hidden="true"
                        className="mr-1 inline size-3"
                      />
                    )}
                    {holding.pnl >= 0 ? "+" : "-"}$
                    {Math.abs(holding.pnl).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                    <span className="sr-only">
                      {holding.pnl >= 0 ? " gain" : " loss"}
                    </span>
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    {holding.allocation.toFixed(1)}%
                  </TableCell>
                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Actions for ${holding.asset}`}
                        >
                          <Ellipsis aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View analysis</DropdownMenuItem>
                        <DropdownMenuItem>Create alert</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
