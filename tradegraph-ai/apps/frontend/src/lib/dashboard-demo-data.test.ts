import { describe, expect, it } from "vitest";

import {
  dataLabel,
  demoAlerts,
  holdings,
  signals,
  watchlistAssets,
} from "@/lib/dashboard-demo-data";

describe("dashboard demo adapter", () => {
  it("keeps unsupported market-account data isolated and explicitly labelled", () => {
    expect(dataLabel).toBe("Illustrative demo data");
    expect(signals.length).toBeGreaterThan(0);
    expect(holdings.length).toBeGreaterThan(0);
    expect(watchlistAssets.length).toBeGreaterThan(0);
    expect(demoAlerts.length).toBeGreaterThan(0);
  });

  it("uses bounded scores and supported semantic values", () => {
    expect(
      signals.every(
        (signal) => signal.confidence >= 0 && signal.confidence <= 100,
      ),
    ).toBe(true);
    expect(
      watchlistAssets.every(
        (asset) => asset.aiScore >= 0 && asset.aiScore <= 100,
      ),
    ).toBe(true);
    expect(
      holdings.reduce((total, holding) => total + holding.allocation, 0),
    ).toBeLessThanOrEqual(100);
  });
});
