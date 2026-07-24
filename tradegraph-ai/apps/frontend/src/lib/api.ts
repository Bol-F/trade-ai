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

export function getHealth(): Promise<HealthResponse> {
  return apiRequest("/health/ready", healthSchema)
}
