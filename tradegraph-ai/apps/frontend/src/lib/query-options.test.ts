import { describe, expect, it } from "vitest"
import { defaultQueryOptions, queryKeys } from "./query-options"

describe("shared query configuration", () => {
  it("deduplicates equivalent catalog requests with stable keys", () => {
    expect(queryKeys.countries()).toEqual(queryKeys.countries(""))
    expect(queryKeys.country("uzb")).toEqual(queryKeys.country("UZB"))
  })

  it("keeps static metadata fresh across page navigation", () => {
    expect(defaultQueryOptions.staleTime).toBeGreaterThanOrEqual(5 * 60 * 1000)
    expect(defaultQueryOptions.gcTime).toBeGreaterThan(defaultQueryOptions.staleTime)
    expect(defaultQueryOptions.refetchOnWindowFocus).toBe(false)
  })
})
