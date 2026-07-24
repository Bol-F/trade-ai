import type { EChartsOption } from "echarts"
import type { TradeTimeseriesPoint } from "@/lib/api"

export function toTimeseriesOption(points: TradeTimeseriesPoint[]): EChartsOption {
  return {
    animationDuration: 400,
    grid: { left: 12, right: 16, top: 28, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: points.map(point => String(point.year)),
      axisLine: { lineStyle: { color: "#7a8491" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => `$${(value / 1_000_000).toFixed(0)}m`,
      },
      splitLine: { lineStyle: { color: "rgba(127,127,127,.18)" } },
    },
    series: [{
      name: "Trade value",
      type: "line",
      smooth: true,
      showSymbol: false,
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 3, color: "#00a8a8" },
      itemStyle: { color: "#00a8a8" },
      data: points.map(point => point.trade_value_usd),
    }],
  }
}
