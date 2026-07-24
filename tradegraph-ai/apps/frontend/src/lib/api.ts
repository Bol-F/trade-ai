import { z } from "zod"
const healthSchema = z.object({ status: z.string(), checks: z.object({ postgres: z.boolean(), redis: z.boolean() }).optional() })
export type HealthResponse = z.infer<typeof healthSchema>
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health/ready`, { cache: "no-store" })
  return healthSchema.parse(await response.json())
}
