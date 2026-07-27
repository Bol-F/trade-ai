import type { EChartsOption } from "echarts"
import type { TradeTimeseriesPoint } from "@/lib/api"

export type TimeseriesMetric = "trade_value_usd" | "quantity_tons"

export function toTimeseriesOption(
  points: TradeTimeseriesPoint[],
  metric: TimeseriesMetric = "trade_value_usd",
): EChartsOption {
  const isValue = metric === "trade_value_usd"
  return {
    animationDuration: 400,
    grid: { left: 12, right: 16, top: 38, bottom: 48, containLabel: true },
    toolbox: {
      right: 8,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {} },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => {
        const numericValue = Number(value)
        return isValue
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(numericValue)
          : `${new Intl.NumberFormat("en-US", { notation: "compact" }).format(numericValue)} t`
      },
    },
    dataZoom: [
      { type: "inside", filterMode: "none" },
      { type: "slider", height: 20, bottom: 4, filterMode: "none" },
    ],
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map(point => String(point.year)),
      axisLine: { lineStyle: { color: "#7a8491" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => isValue
          ? `$${(value / 1_000_000).toFixed(0)}m`
          : `${(value / 1_000).toFixed(0)}k t`,
      },
      splitLine: { lineStyle: { color: "rgba(127,127,127,.18)" } },
    },
    series: [{
      name: isValue ? "Trade value" : "Reported quantity",
      type: "line",
      smooth: 0.2,
      showSymbol: true,
      symbolSize: 7,
      emphasis: { focus: "series", scale: 1.5 },
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 3, color: "#00a8a8" },
      itemStyle: { color: "#00a8a8" },
      data: points.map(point => point[metric]),
    }],
  }
}
