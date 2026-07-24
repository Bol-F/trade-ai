import { expect, test } from "@playwright/test"
test("shows the TradeGraph landing page", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /see global trade/i })).toBeVisible() })
