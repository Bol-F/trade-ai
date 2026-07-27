import { describe, expect, it } from "vitest";
import ForecastPage from "@/app/forecast/page";
import SupplierFinderPage from "@/app/supplier-finder/page";
import { ForecastDashboard } from "@/components/forecast-dashboard";
import { SupplierFinder } from "@/components/supplier-finder";

describe("ML routes", () => {
  it("renders the local forecast workflow", () => {
    expect(ForecastPage().type).toBe(ForecastDashboard);
  });

  it("renders the transparent supplier workflow", () => {
    expect(SupplierFinderPage().type).toBe(SupplierFinder);
  });
});
