"use client";

import {
  Bell,
  CircleAlert,
  Eye,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  ConfidenceIndicator,
  RiskIndicator,
  StatusBadge,
} from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const watchlist = [
  ["NVDA", "$128.44", "+2.8%", "up"],
  ["MSFT", "$442.31", "+0.7%", "up"],
  ["EUR/USD", "1.0842", "-0.3%", "down"],
] as const;

export function LandingDashboardPreview({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden border-border-strong py-0 shadow-elevated",
        compact && "lg:-mr-12",
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/35 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" />
          <span className="text-xs font-medium">Portfolio intelligence</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          DEMO DATA
        </Badge>
      </div>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-[11px] text-muted-foreground">Portfolio value</p>
            <p
              className="mt-2 font-mono text-xl font-semibold"
              data-financial-value="true"
            >
              $248,620
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <TrendingUp aria-hidden="true" className="size-3" />
              +1.24% today
            </p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <ConfidenceIndicator value={82} label="AI confidence" />
          </div>
          <div className="rounded-lg border bg-background p-3">
            <RiskIndicator score={36} />
          </div>
        </div>
        <div
          className={cn(
            "mt-3 grid gap-3",
            compact
              ? "xl:grid-cols-[1fr_.55fr]"
              : "lg:grid-cols-[1.25fr_.75fr]",
          )}
        >
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Performance</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Illustrative 30-day portfolio movement
                </p>
              </div>
              <StatusBadge tone="success">+4.7%</StatusBadge>
            </div>
            <figure
              className="mt-4"
              aria-label="Illustrative portfolio performance chart"
            >
              <svg
                viewBox="0 0 560 190"
                role="img"
                className="h-auto w-full"
                aria-labelledby="preview-chart-title preview-chart-desc"
              >
                <title id="preview-chart-title">
                  Thirty-day illustrative portfolio performance
                </title>
                <desc id="preview-chart-desc">
                  A blue line rises with several moderate declines and ends
                  above its starting point.
                </desc>
                <defs>
                  <linearGradient
                    id="landing-chart-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0"
                      stopColor="var(--chart-primary)"
                      stopOpacity=".24"
                    />
                    <stop
                      offset="1"
                      stopColor="var(--chart-primary)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                {[32, 76, 120, 164].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="560"
                    y1={y}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeWidth="1"
                  />
                ))}
                <path
                  d="M0 158 C38 150,60 132,92 138 S145 116,178 123 S230 82,264 94 S322 61,356 72 S418 36,451 54 S518 25,560 30 L560 190 L0 190 Z"
                  fill="url(#landing-chart-fill)"
                />
                <path
                  d="M0 158 C38 150,60 132,92 138 S145 116,178 123 S230 82,264 94 S322 61,356 72 S418 36,451 54 S518 25,560 30"
                  fill="none"
                  stroke="var(--chart-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="560" cy="30" r="5" fill="var(--chart-primary)" />
              </svg>
              <figcaption className="sr-only">
                Illustrative demo data; not an actual or promised investment
                return.
              </figcaption>
            </figure>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Watchlist</p>
              <Eye
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
              />
            </div>
            <div className="mt-3 divide-y">
              {watchlist.map(([symbol, price, change, direction]) => (
                <div
                  key={symbol}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <p className="font-mono font-medium">{symbol}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {price}
                    </p>
                  </div>
                  <span
                    className={
                      direction === "up" ? "text-success" : "text-destructive"
                    }
                  >
                    {direction === "up" ? (
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
                    {change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {!compact && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="size-4 text-primary" />
                <p className="text-xs font-medium">Active signal</p>
              </div>
              <p className="mt-3 text-sm font-medium">
                Momentum improving with moderate confidence
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Price trend and volume confirmation are aligned; volatility
                remains above the recent median.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2">
                <Bell aria-hidden="true" className="size-4 text-warning" />
                <p className="text-xs font-medium">Recent market activity</p>
              </div>
              <div className="mt-3 flex gap-3">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-warning"
                />
                <div>
                  <p className="text-sm font-medium">Risk threshold changed</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    EUR/USD volatility moved above the configured watch level ·
                    12 min ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
