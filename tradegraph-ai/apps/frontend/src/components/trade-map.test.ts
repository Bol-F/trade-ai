import { describe, expect, it } from "vitest";
import { arcCoordinates, tradeMapStyle } from "@/components/trade-map";

describe("trade map arcs", () => {
  it("preserves endpoints and creates an aggregated curved path", () => {
    const points = arcCoordinates([0, 0], [10, 10]);
    expect(points).toHaveLength(25);
    expect(points[0]).toEqual([0, 0]);
    expect(points.at(-1)).toEqual([10, 10]);
    expect(points[12]).not.toEqual([5, 5]);
  });

  it("owns the style document and keeps a background when raster tiles fail", () => {
    expect(tradeMapStyle.version).toBe(8);
    expect(tradeMapStyle.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ocean", type: "background" }),
      ]),
    );
    expect(tradeMapStyle.sources).toHaveProperty("openStreetMap");
  });
});
