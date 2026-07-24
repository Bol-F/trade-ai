import { z } from "zod"

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
const healthSchema = z.object({
  status: z.string(),
  checks: z.object({ postgres: z.boolean(), redis: z.boolean() }).optional(),
})
export type HealthResponse = z.infer<typeof healthSchema>

export class ApiError extends Error {
  constructor(public code: string, message: string, public details: unknown, public status: number) {
    super(message)
  }
}

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase()
  const csrfToken = typeof document === "undefined"
    ? undefined
    : document.cookie.split("; ").find(cookie => cookie.startsWith("csrftoken="))?.split("=")[1]
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method) ? { "X-CSRFToken": decodeURIComponent(csrfToken) } : {}),
      ...init.headers,
    },
  })
  if (response.status === 401 && allowRefresh && path !== "/auth/refresh") {
    await apiRequest(
      "/auth/refresh",
      z.object({ status: z.string() }),
      { method: "POST" },
      false,
    )
    return apiRequest(path, schema, init, false)
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const error = payload?.error
    throw new ApiError(
      error?.code ?? "REQUEST_FAILED",
      error?.message ?? "The request could not be completed.",
      error?.details ?? {},
      response.status,
    )
  }
  if (response.status === 204) return undefined as T
  return schema.parse(await response.json())
}

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(["user", "admin"]),
  date_joined: z.string(),
  updated_at: z.string(),
})
export type User = z.infer<typeof userSchema>

export const countrySchema = z.object({
  id: z.number(),
  baci_code: z.string(),
  m49_code: z.string(),
  iso2: z.string(),
  iso3: z.string(),
  name: z.string(),
  region: z.string(),
  subregion: z.string(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  landlocked: z.boolean(),
  is_active: z.boolean(),
})
export type Country = z.infer<typeof countrySchema>

const classificationSchema = z.object({ code: z.string(), name: z.string(), version: z.string() })
export const productSchema = z.object({
  id: z.number(),
  classification: classificationSchema,
  code: z.string(),
  level: z.number(),
  parent_code: z.string(),
  name: z.string(),
  description: z.string(),
  is_active: z.boolean(),
})
export type Product = z.infer<typeof productSchema>

export const metaSchema = z.object({
  dataset_version: z.string().nullable(),
  source_period_end: z.number().nullable(),
  generated_at: z.string(),
})
const overviewSchema = z.object({
  data: z.object({
    total_trade_value_usd: z.number().nullable(),
    total_quantity_tons: z.number().nullable(),
    partner_count: z.number(),
    yoy_change_percent: z.number().nullable(),
  }),
  meta: metaSchema,
})
const timeseriesSchema = z.object({
  data: z.array(z.object({
    year: z.number(),
    trade_value_usd: z.number().nullable(),
    quantity_tons: z.number().nullable(),
  })),
  meta: metaSchema,
})
const partnersSchema = z.object({
  data: z.array(z.object({
    iso3: z.string(),
    name: z.string(),
    trade_value_usd: z.number().nullable(),
    quantity_tons: z.number().nullable(),
  })),
  meta: metaSchema,
})
const topProductsSchema = z.object({
  data: z.array(z.object({
    code: z.string(),
    name: z.string(),
    trade_value_usd: z.number().nullable(),
  })),
  meta: metaSchema,
})
export type TradeTimeseriesPoint = z.infer<typeof timeseriesSchema>["data"][number]

function pageSchema<T>(item: z.ZodType<T>) {
  return z.object({ count: z.number(), next: z.string().nullable(), previous: z.string().nullable(), results: z.array(item) })
}

export const authApi = {
  me: () => apiRequest("/auth/me", userSchema),
  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", userSchema, { method: "POST", body: JSON.stringify(data) }),
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    apiRequest("/auth/register", userSchema, { method: "POST", body: JSON.stringify(data) }),
  logout: () => apiRequest("/auth/logout", z.undefined(), { method: "POST" }),
}

export const catalogApi = {
  countries: (search: string) =>
    apiRequest(`/countries?search=${encodeURIComponent(search)}`, pageSchema(countrySchema)),
  country: (iso3: string) => apiRequest(`/countries/${encodeURIComponent(iso3)}`, countrySchema),
  products: (search: string) =>
    apiRequest(`/products?search=${encodeURIComponent(search)}`, pageSchema(productSchema)),
  product: (code: string) => apiRequest(`/products/${encodeURIComponent(code)}`, productSchema),
}

export type TradeFilters = {
  importer?: string
  exporter?: string
  product?: string
  start_year?: string
  end_year?: string
}

function filterQuery(filters: TradeFilters): string {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return params.toString()
}

export const tradeApi = {
  overview: (filters: TradeFilters) => apiRequest(`/trade/overview?${filterQuery(filters)}`, overviewSchema),
  timeseries: (filters: TradeFilters) => apiRequest(`/trade/timeseries?${filterQuery(filters)}`, timeseriesSchema),
  partners: (filters: TradeFilters) => apiRequest(`/trade/partners?${filterQuery(filters)}`, partnersSchema),
  topProducts: (filters: TradeFilters) => apiRequest(`/trade/top-products?${filterQuery(filters)}`, topProductsSchema),
  map: (filters: TradeFilters & { top?: string }) => apiRequest(`/trade/map?${filterQuery(filters)}`, mapSchema),
}

const partnerMetricSchema = z.object({
  iso3: z.string(),
  name: z.string(),
  trade_value_usd: z.number(),
  share: z.number().optional(),
})
const historyMetricSchema = z.object({
  year: z.number(),
  value: z.union([z.string(), z.number()]).nullable(),
  quantity: z.union([z.string(), z.number()]).nullable(),
})
const concentrationSchema = z.object({
  hhi: z.number(),
  supplier_count: z.number(),
  suppliers: z.array(partnerMetricSchema),
})
const exposureSchema = z.object({
  score: z.number(),
  components: z.record(z.string(), z.number()),
  methodology: z.string(),
  hhi: z.number(),
  supplier_count: z.number(),
  volatility: z.number(),
})
const anomalySchema = z.object({
  year: z.number(),
  anomaly_score: z.number(),
  severity: z.enum(["normal", "watch", "high_anomaly"]),
  direction: z.enum(["up", "down", "flat"]),
  detected_features: z.array(z.string()),
  explanation: z.string(),
})
const mapSchema = z.object({
  data: z.array(z.object({
    exporter: z.object({ iso3: z.string(), name: z.string(), latitude: z.number().nullable(), longitude: z.number().nullable() }),
    importer: z.object({ iso3: z.string(), name: z.string(), latitude: z.number().nullable(), longitude: z.number().nullable() }),
    trade_value_usd: z.number().nullable(),
  })),
  meta: metaSchema,
})
const countryProfileSchema = z.object({
  data: z.object({
    iso3: z.string(),
    total_imports_usd: z.number(),
    total_exports_usd: z.number(),
    top_products: z.array(z.object({ code: z.string(), trade_value_usd: z.number() })),
    top_suppliers: z.array(partnerMetricSchema),
    top_destinations: z.array(partnerMetricSchema),
    concentration: concentrationSchema,
    exposure: exposureSchema,
    history: z.array(historyMetricSchema),
  }),
  meta: metaSchema,
})
const productProfileSchema = z.object({
  data: z.object({
    hs2: z.string(),
    name: z.string(),
    global_trend: z.array(historyMetricSchema),
    top_exporters: z.array(partnerMetricSchema),
    top_importers: z.array(partnerMetricSchema),
    fastest_growing_countries: z.array(z.object({ iso3: z.string(), cagr: z.number() })),
    concentration: concentrationSchema,
    anomalies: z.array(anomalySchema),
  }),
  meta: metaSchema,
})
const anomaliesSchema = z.object({ data: z.array(anomalySchema), meta: metaSchema })

export type MapFlow = z.infer<typeof mapSchema>["data"][number]
export type CountryProfile = z.infer<typeof countryProfileSchema>["data"]
export type ProductProfile = z.infer<typeof productProfileSchema>["data"]
export type TradeAnomaly = z.infer<typeof anomalySchema>

export const analyticsApi = {
  countryProfile: (iso3: string) => apiRequest(`/analytics/country-profile/${encodeURIComponent(iso3)}`, countryProfileSchema),
  productProfile: (hs2: string) => apiRequest(`/analytics/product-profile/${encodeURIComponent(hs2)}`, productProfileSchema),
  anomalies: (filters: TradeFilters) => apiRequest(`/analytics/anomalies?${filterQuery(filters)}`, anomaliesSchema),
}

export function getHealth(): Promise<HealthResponse> {
  return apiRequest("/health/ready", healthSchema)
}
