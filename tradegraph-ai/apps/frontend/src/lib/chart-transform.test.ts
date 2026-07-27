import { describe, expect, it } from "vitest"
import { toTimeseriesOption } from "@/lib/chart-transform"

describe("toTimeseriesOption", () => {
  it("keeps chronological labels and null observations", () => {
    const option = toTimeseriesOption([
      { year: 2023, trade_value_usd: 1_000_000, quantity_tons: 10 },
      { year: 2024, trade_value_usd: null, quantity_tons: null },
    ])
    expect(option.xAxis).toMatchObject({ data: ["2023", "2024"] })
    expect(option.series).toMatchObject([{ data: [1_000_000, null] }])
    expect(option.dataZoom).toHaveLength(2)
  })

  it("switches to reported quantity without replacing the timeline", () => {
    const option = toTimeseriesOption([
      { year: 2023, trade_value_usd: 1_000_000, quantity_tons: 10 },
      { year: 2024, trade_value_usd: 2_000_000, quantity_tons: 25 },
    ], "quantity_tons")

    expect(option.xAxis).toMatchObject({ data: ["2023", "2024"] })
    expect(option.series).toMatchObject([{ name: "Reported quantity", data: [10, 25] }])
  })
})
