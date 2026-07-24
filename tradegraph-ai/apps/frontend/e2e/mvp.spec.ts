import { expect, test, type Page } from "@playwright/test"

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "mvp@example.com",
  first_name: "MVP",
  last_name: "User",
  role: "user",
  date_joined: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}
const meta = { dataset_version: "sample-v1", source_period_end: 2024, generated_at: "2024-01-01T00:00:00Z" }

async function mockApi(page: Page) {
  let authenticated = false
  await page.route("http://localhost:8000/api/v1/**", async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const fulfill = (json: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) })
    if (path.endsWith("/auth/me")) return authenticated ? fulfill(user) : fulfill({ error: { code: "UNAUTHORIZED", message: "Unauthorized", details: {} } }, 401)
    if (path.endsWith("/auth/refresh")) return fulfill({ error: { code: "UNAUTHORIZED", message: "Unauthorized", details: {} } }, 401)
    if (path.endsWith("/auth/register") || path.endsWith("/auth/login")) { authenticated = true; return fulfill(user) }
    if (path.endsWith("/auth/logout")) {
      authenticated = false
      return route.fulfill({ status: 204, body: "" })
    }
    if (path.endsWith("/countries") || path.includes("/countries?")) return fulfill({ count: 1, next: null, previous: null, results: [{ id: 1, baci_code: "860", m49_code: "860", iso2: "UZ", iso3: "UZB", name: "Uzbekistan", region: "Asia", subregion: "Central Asia", latitude: "41.3", longitude: "64.5", landlocked: true, is_active: true }] })
    if (path.endsWith("/countries/UZB")) return fulfill({ id: 1, baci_code: "860", m49_code: "860", iso2: "UZ", iso3: "UZB", name: "Uzbekistan", region: "Asia", subregion: "Central Asia", latitude: "41.3", longitude: "64.5", landlocked: true, is_active: true })
    if (path.endsWith("/trade/overview")) return fulfill({ data: { total_trade_value_usd: 1000000, total_quantity_tons: 100, partner_count: 1, yoy_change_percent: 5 }, meta })
    if (path.endsWith("/trade/timeseries")) return fulfill({ data: [{ year: 2023, trade_value_usd: 900000, quantity_tons: 90 }, { year: 2024, trade_value_usd: 1000000, quantity_tons: 100 }], meta })
    if (path.endsWith("/trade/partners")) return fulfill({ data: [{ iso3: "UZB", name: "Uzbekistan", trade_value_usd: 1000000, quantity_tons: 100 }], meta })
    if (path.endsWith("/trade/top-products")) return fulfill({ data: [{ code: "010121", name: "Pure-bred horses", trade_value_usd: 1000000 }], meta })
    if (path.endsWith("/analytics/country-profile/UZB")) return fulfill({ data: { iso3: "UZB", total_imports_usd: 1000000, total_exports_usd: 2000000, top_products: [{ code: "01", trade_value_usd: 1000000 }], top_suppliers: [], top_destinations: [], concentration: { hhi: 0.5, supplier_count: 2, suppliers: [] }, exposure: { score: 42, components: {}, methodology: "Transparent indicator.", hhi: 0.5, supplier_count: 2, volatility: 0.1 }, history: [{ year: 2024, value: 3000000, quantity: 100 }] }, meta })
    if (path.endsWith("/ml/forecast")) return fulfill({ request_id: "22222222-2222-4222-8222-222222222222", historical_values: [{ year: 2023, value: 900000 }, { year: 2024, value: 1000000 }], forecast: { year: 2025, value: 1100000 }, baseline_forecast: 950000, model_name: "three_year_moving_average", model_version: "baseline-v1", dataset_version: "sample-v1", training_period: {}, metrics: {}, main_input_factors: ["trade_value_lag_1"], data_freshness: 2024 })
    if (path.endsWith("/saved-analyses")) return fulfill({ id: "33333333-3333-4333-8333-333333333333", title: "Saved", description: "", filters: {}, visualization: "explorer", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" }, 201)
    return fulfill({ error: { code: "NOT_MOCKED", message: path, details: {} } }, 404)
  })
}

test("register, explore, view profile, forecast, save and logout", async ({ page }) => {
  await mockApi(page)
  await page.goto("/register")
  await page.getByLabel("First name").fill("MVP")
  await page.getByLabel("Last name").fill("User")
  await page.getByLabel("Email").fill("mvp@example.com")
  await page.getByLabel("Password").fill("StrongPass123!")
  await page.getByRole("button", { name: "Register" }).click()
  await expect(page).toHaveURL(/countries/)

  await page.goto("/explorer")
  await page.getByLabel("Importer").selectOption("UZB")
  await page.getByRole("button", { name: "Apply" }).click()
  await expect(page.getByRole("img", { name: "Annual trade value chart" })).toBeVisible()
  await page.getByRole("button", { name: "Save analysis" }).click()
  await expect(page.getByRole("button", { name: "Analysis saved" })).toBeVisible()

  await page.goto("/countries/UZB")
  await expect(page.getByRole("heading", { name: "Uzbekistan" })).toBeVisible()
  await page.goto("/forecast")
  await page.getByRole("button", { name: "Run forecast" }).click()
  await expect(page.getByText("Model forecast")).toBeVisible()
  await page.getByRole("button", { name: "Log out" }).click()
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
})

test("login flow", async ({ page }) => {
  await mockApi(page)
  await page.goto("/login")
  await page.getByLabel("Email").fill("mvp@example.com")
  await page.getByLabel("Password").fill("StrongPass123!")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(/countries/)
})
