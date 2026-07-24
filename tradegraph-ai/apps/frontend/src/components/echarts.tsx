"use client"

import { init, type EChartsOption } from "echarts"
import { useEffect, useRef } from "react"

export function EChart({ option }: { option: EChartsOption }) {
  const element = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!element.current) return
    const chart = init(element.current)
    chart.setOption(option)
    const resize = () => chart.resize()
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      chart.dispose()
    }
  }, [option])
  return <div ref={element} className="h-[340px] w-full" role="img" aria-label="Annual trade value chart" />
}
