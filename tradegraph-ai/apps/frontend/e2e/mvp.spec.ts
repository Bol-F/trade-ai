import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "mvp@example.com",
  first_name: "MVP",
  last_name: "User",
  role: "user",
  date_joined: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};
const meta = {
  dataset_version: "sample-v1",
  source_period_end: 2024,
  generated_at: "2024-01-01T00:00:00Z",
};

async function mockApi(page: Page, role: "user" | "admin" = "user") {
  let authenticated = false;
  const sessionUser = { ...user, role };
  await page.route("http://localhost:8000/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const fulfill = (json: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(json),
      });
    if (path.endsWith("/auth/csrf"))
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie": "csrftoken=test-csrf-token; Path=/; SameSite=Lax",
        },
        body: JSON.stringify({ csrf_token: "test-csrf-token" }),
      });
    if (path.endsWith("/auth/me"))
      return authenticated
        ? fulfill(sessionUser)
        : fulfill(
            {
              error: {
                code: "UNAUTHORIZED",
                message: "Unauthorized",
                details: {},
              },
            },
            401,
          );
    if (path.endsWith("/auth/refresh"))
      return fulfill(
        {
          error: { code: "UNAUTHORIZED", message: "Unauthorized", details: {} },
        },
        401,
      );
    if (path.endsWith("/auth/register") || path.endsWith("/auth/login")) {
      authenticated = true;
      return fulfill(sessionUser);
    }
    if (path.endsWith("/auth/logout")) {
      authenticated = false;
      return route.fulfill({ status: 204, body: "" });
    }
    if (path.endsWith("/countries") || path.includes("/countries?"))
      return fulfill({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            baci_code: "860",
            m49_code: "860",
            iso2: "UZ",
            iso3: "UZB",
            name: "Uzbekistan",
            region: "Asia",
            subregion: "Central Asia",
            latitude: "41.3",
            longitude: "64.5",
            landlocked: true,
            is_active: true,
          },
        ],
      });
    if (path.endsWith("/countries/UZB"))
      return fulfill({
        id: 1,
        baci_code: "860",
        m49_code: "860",
        iso2: "UZ",
        iso3: "UZB",
        name: "Uzbekistan",
        region: "Asia",
        subregion: "Central Asia",
        latitude: "41.3",
        longitude: "64.5",
        landlocked: true,
        is_active: true,
      });
    if (path.endsWith("/products") || path.includes("/products?"))
      return fulfill({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            code: "01",
            level: 2,
            name: "Live animals",
            parent_code: null,
            is_active: true,
          },
        ],
      });
    if (path.endsWith("/products/01"))
      return fulfill({
        id: 1,
        code: "01",
        level: 2,
        name: "Live animals",
        parent_code: null,
        is_active: true,
      });
    if (path.endsWith("/data-sources"))
      return fulfill({
        data: [
          {
            code: "BACI",
            name: "CEPII BACI",
            description: "Harmonized bilateral trade data.",
            homepage_url: "https://www.cepii.fr/",
            attribution_text: "CEPII BACI",
            requires_api_key: false,
            is_enabled: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        meta,
      });
    if (path.endsWith("/trade/overview"))
      return fulfill({
        data: {
          total_trade_value_usd: 1000000,
          total_quantity_tons: 100,
          partner_count: 1,
          yoy_change_percent: 5,
        },
        meta,
      });
    if (path.endsWith("/trade/timeseries"))
      return fulfill({
        data: [
          { year: 2023, trade_value_usd: 900000, quantity_tons: 90 },
          { year: 2024, trade_value_usd: 1000000, quantity_tons: 100 },
        ],
        meta,
      });
    if (path.endsWith("/trade/partners"))
      return fulfill({
        data: [
          {
            iso3: "UZB",
            name: "Uzbekistan",
            trade_value_usd: 1000000,
            quantity_tons: 100,
          },
        ],
        meta,
      });
    if (path.endsWith("/trade/top-products"))
      return fulfill({
        data: [
          {
            code: "010121",
            name: "Pure-bred horses",
            trade_value_usd: 1000000,
          },
        ],
        meta,
      });
    if (path.endsWith("/analytics/country-profile/UZB"))
      return fulfill({
        data: {
          iso3: "UZB",
          total_imports_usd: 1000000,
          total_exports_usd: 2000000,
          top_products: [{ code: "01", trade_value_usd: 1000000 }],
          top_suppliers: [],
          top_destinations: [],
          concentration: { hhi: 0.5, supplier_count: 2, suppliers: [] },
          exposure: {
            score: 42,
            components: {},
            component_explanations: {},
            insufficient_history: false,
            quantity_data_available: true,
            methodology: "Transparent indicator.",
            hhi: 0.5,
            supplier_count: 2,
            volatility: 0.1,
          },
          history: [{ year: 2024, value: 3000000, quantity: 100 }],
        },
        meta,
      });
    if (path.endsWith("/analytics/product-profile/01"))
      return fulfill({
        data: {
          hs2: "01",
          name: "Live animals",
          global_trend: [{ year: 2024, value: 3000000, quantity: 100 }],
          top_exporters: [],
          top_importers: [],
          fastest_growing_countries: [],
          concentration: { hhi: 0.5, supplier_count: 2, suppliers: [] },
          anomalies: [],
        },
        meta,
      });
    if (path.endsWith("/analytics/map"))
      return fulfill({
        data: [
          {
            exporter: {
              iso3: "UZB",
              name: "Uzbekistan",
              latitude: 41.3,
              longitude: 64.5,
            },
            importer: {
              iso3: "USA",
              name: "United States",
              latitude: 38,
              longitude: -97,
            },
            trade_value_usd: 1000000,
          },
        ],
        meta,
      });
    if (path.endsWith("/ml/forecast"))
      return fulfill({
        request_id: "22222222-2222-4222-8222-222222222222",
        historical_values: [
          { year: 2023, value: 900000 },
          { year: 2024, value: 1000000 },
        ],
        forecast: {
          year: 2025,
          value: 1100000,
          lower_bound: 700000,
          upper_bound: 1500000,
          coverage_level: 0.95,
          interval_method: "validation-residual normal approximation",
        },
        baseline_forecast: 950000,
        model_name: "three_year_moving_average",
        model_version: "baseline-v1",
        dataset_version: "sample-v1",
        training_period: {},
        metrics: {},
        main_input_factors: ["trade_value_lag_1"],
        factor_definitions: [
          {
            feature: "trade_value_lag_1",
            display_name: "Recent trade value",
            description: "Previous year.",
            unit: "USD",
            direction: "Higher may increase.",
            limitation: "Cannot know shocks.",
          },
        ],
        explanations: ["The baseline follows recent trade."],
        warnings: [],
        used_fallback: true,
        data_freshness: 2024,
        lineage: {
          data_source: "BACI",
          dataset_version: "sample-v1",
          feature_dataset_version: "sample-v1",
          feature_schema_version: "forecast-v2",
          model_version: "baseline-v1",
          training_period: {},
          inference_timestamp: "2024-01-01T00:00:00Z",
        },
      });
    if (path.endsWith("/ml/supplier-recommendations"))
      return fulfill({
        candidates: [
          {
            country: "UZB",
            name: "Uzbekistan",
            recommendation_score: 82,
            component_scores: {
              trade_scale: 0.9,
              stability: 0.8,
              diversification: 0.7,
            },
            reasons: [
              "Strong recent trade scale",
              "Relatively stable supply history",
            ],
          },
        ],
        data_freshness: 2024,
        dataset_version: "sample-v1",
        methodology: "Transparent weighted ranking.",
      });
    if (path.endsWith("/admin/data-health"))
      return fulfill({
        sources: [],
        active_dataset: {
          version: "sample-v1",
          source: "BACI",
          row_count: 1000,
          period_start: 2020,
          period_end: 2024,
          promoted_at: "2024-01-01T00:00:00Z",
        },
        versions: [
          {
            version: "sample-v1",
            source: "BACI",
            status: "active",
            is_active: true,
            row_count: 1000,
            period_start: 2020,
            period_end: 2024,
          },
        ],
        ingestion_runs: [],
        failures: 0,
        models: [],
        active_models: 1,
        data_freshness: 2024,
        cache_status: "healthy",
      });
    if (path.endsWith("/saved-analyses"))
      return fulfill(
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Saved",
          description: "",
          filters: {},
          visualization: "explorer",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        201,
      );
    return fulfill(
      { error: { code: "NOT_MOCKED", message: path, details: {} } },
      404,
    );
  });
}

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations,
    results.violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
      )
      .join("\n"),
  ).toEqual([]);
}

test("register, explore, view profile, forecast, save and logout", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/register");
  await page.getByLabel("First name").fill("MVP");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel("Email").fill("mvp@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto("/explorer");
  await page.getByLabel("Importer").selectOption("UZB");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(
    page.getByRole("img", { name: "Annual trade value" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save analysis" }).click();
  await expect(
    page.getByRole("button", { name: "Analysis saved" }),
  ).toBeVisible();

  await page.goto("/countries/UZB");
  await expect(page.getByRole("heading", { name: "Uzbekistan" })).toBeVisible();
  await page.goto("/forecast");
  await page.getByRole("button", { name: "Run forecast" }).click();
  await expect(page.getByText("Active-model forecast")).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("login flow", async ({ page }) => {
  await mockApi(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill("mvp@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("public, authentication, and dashboard surfaces pass automated accessibility checks", async ({
  page,
}) => {
  await mockApi(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await page.getByLabel("Email").fill("mvp@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test("dashboard protects unauthorized users and remains overflow-free at required breakpoints", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Sign in to open the dashboard" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign In" })).toHaveAttribute(
    "href",
    "/login",
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill("mvp@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();

  const widths = [1440, 1280, 1024, 768, 430, 390, 360];
  const routes = [
    "/dashboard",
    "/dashboard/signals",
    "/dashboard/market",
    "/dashboard/portfolio",
    "/dashboard/watchlist",
    "/dashboard/alerts",
    "/dashboard/settings",
  ];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
        `${route} overflows at ${width}px`,
      ).toBe(true);
    }
    if (width < 1024) {
      await page
        .getByRole("button", { name: "Open dashboard navigation" })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    }
  }
});

test("authenticated dashboard navigation and core interactions", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill("mvp@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Illustrative 30-day portfolio performance chart",
    }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search dashboard" })
    .fill("Portfolio");
  await page
    .getByRole("searchbox", { name: "Search dashboard" })
    .press("Enter");
  await expect(page).toHaveURL(/dashboard\/portfolio/);
  await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();

  await page.getByRole("link", { name: "AI Signals" }).click();
  await page.getByPlaceholder("Search asset or ticker…").fill("NVDA");
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toContainText("AI analysis summary");
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Market Analysis" }).click();
  await page.getByRole("tab", { name: "1Y" }).click();
  await expect(
    page.getByRole("img", { name: "NVDA illustrative 1Y price chart" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Watchlist" }).click();
  await page.getByRole("button", { name: "Add asset" }).click();
  await page.getByLabel("Ticker symbol").fill("TSLA");
  await page.getByRole("button", { name: "Add to watchlist" }).click();
  await expect(page.getByText("TSLA demo asset")).toBeVisible();

  await page.getByRole("link", { name: "Alerts" }).click();
  await page.getByRole("button", { name: "Create alert" }).click();
  await page.getByLabel("Asset").fill("NVDA");
  await page.getByLabel("Condition").fill("Price above $130");
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(page.getByText("Price above $130")).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Security" }).click();
  await expect(
    page.getByText("Two-factor authentication", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enable two-factor authentication" }),
  ).toBeDisabled();
});

test("Russian locale switches and persists across navigation", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Language: English" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("heading", {
      name: "Smarter Market Decisions Powered by AI",
    }),
  ).toBeVisible();

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("button", { name: "Язык: Русский" }),
  ).toBeVisible();

  await page.goto("/forecast");
  await expect(
    page.getByRole("heading", { name: "Прогноз торговли" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Рассчитать прогноз" }),
  ).toBeVisible();
});

test("responsive, dark mode, URL filters, and reference screenshots", async ({
  page,
}) => {
  await mockApi(page, "admin");
  const screenshotDir = join(process.cwd(), "e2e", "screenshots");
  await mkdir(screenshotDir, { recursive: true });

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Smarter Market Decisions Powered by AI",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start Free Analysis" }),
  ).toHaveAttribute("href", "/register");
  await expect(
    page.getByRole("link", { name: "View Live Dashboard" }),
  ).toHaveAttribute("href", "/explorer");
  await expect(
    page.getByText(/Trade AI provides analytical information only/),
  ).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "landing-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open landing navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "dashboard-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open dashboard navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Portfolio" })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto("/explorer?importer=UZB&product=01");
  await expect(page.getByLabel("Importer")).toHaveValue("UZB");
  await expect(page.getByLabel("Product")).toHaveValue("01");
  await page.screenshot({
    path: join(screenshotDir, "explorer-desktop.png"),
    fullPage: true,
  });

  await page.goto("/countries/UZB");
  await expect(page.getByRole("heading", { name: "Uzbekistan" })).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "country-profile.png"),
    fullPage: true,
  });

  await page.goto("/products/01");
  await expect(
    page.getByRole("heading", { name: "Live animals" }),
  ).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "product-profile.png"),
    fullPage: true,
  });

  await page.goto("/forecast");
  await page.getByRole("button", { name: "Run forecast" }).click();
  await expect(page.getByText("Active-model forecast")).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "forecast.png"),
    fullPage: true,
  });

  await page.goto("/supplier-finder");
  await page.getByRole("button", { name: "Find suppliers" }).click();
  await expect(page.getByText("Uzbekistan")).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "supplier-finder.png"),
    fullPage: true,
  });

  await page.goto("/map");
  await expect(
    page.getByRole("region", { name: "Trade flow visualization" }),
  ).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "trade-map.png"),
    fullPage: true,
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.goto("/admin/data-health");
  await expect(
    page.getByRole("heading", { name: "Data health" }),
  ).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "admin-data-health.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explorer");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: join(screenshotDir, "mobile-navigation.png"),
    fullPage: true,
  });

  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.screenshot({
    path: join(screenshotDir, "explorer-mobile-light.png"),
    fullPage: true,
  });
});
