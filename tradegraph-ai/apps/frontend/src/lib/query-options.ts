export const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const

export const queryKeys = {
  countries: (search = "") => ["countries", search] as const,
  products: (search = "") => ["products", search] as const,
  country: (iso3: string) => ["country", iso3.toUpperCase()] as const,
  product: (code: string) => ["product", code] as const,
} as const
