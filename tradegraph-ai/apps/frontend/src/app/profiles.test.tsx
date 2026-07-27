import { describe, expect, it } from "vitest";
import CountryPage from "@/app/countries/[iso3]/page";
import ProductPage from "@/app/products/[code]/page";
import {
  CountryAnalyticsProfile,
  ProductAnalyticsProfile,
} from "@/components/analytics-profiles";

describe("analytics profile routes", () => {
  it("passes the ISO3 segment to the country profile", async () => {
    const page = await CountryPage({
      params: Promise.resolve({ iso3: "UZB" }),
    });
    expect(page.type).toBe(CountryAnalyticsProfile);
    expect(page.props.iso3).toBe("UZB");
  });

  it("passes leading-zero product codes to the product profile", async () => {
    const page = await ProductPage({
      params: Promise.resolve({ code: "010121" }),
    });
    expect(page.type).toBe(ProductAnalyticsProfile);
    expect(page.props.code).toBe("010121");
  });
});
