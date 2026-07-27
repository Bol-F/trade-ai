"use client";

import { BarChart, LineChart, ScatterChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";
import {
  init,
  use as registerEChartsModules,
  type EChartsCoreOption,
  type EChartsType,
} from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

registerEChartsModules([
  BarChart,
  LineChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export function EChart({
  option,
  ariaLabel = "Data chart",
}: {
  option: EChartsCoreOption;
  ariaLabel?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType>(null);

  useEffect(() => {
    if (!element.current) return;
    chart.current = init(element.current);
    const observer = new ResizeObserver(() => chart.current?.resize());
    observer.observe(element.current);

    return () => {
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={element}
      className="h-[340px] w-full"
      role="img"
      aria-label={ariaLabel}
    />
  );
}
