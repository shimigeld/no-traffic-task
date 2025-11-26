import { describe, expect, it } from "vitest";
import { isPointInPolygon, polygonArea, polygonCentroid, normalizePolygon } from "@/lib/geometry";
import type { Polygon } from "@/types/polygon";

describe("geometry helpers", () => {
  const square = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ] as [number, number][];

  it("detects points inside a polygon", () => {
    expect(isPointInPolygon([5, 5], square)).toBe(true);
    expect(isPointInPolygon([12, 5], square)).toBe(false);
  });

  it("calculates polygon area", () => {
    expect(polygonArea(square)).toBe(100);
    expect(polygonArea([[0, 0], [1, 0]])).toBe(0);
  });

  it("computes centroids and normalizes polygons", () => {
    expect(polygonCentroid(square)).toEqual([5, 5]);
    expect(polygonCentroid([])).toEqual([0, 0]);

    const rawPolygon: Polygon = {
      id: "poly",
      name: "Poly",
      points: [
        ["1" as unknown as number, "2" as unknown as number],
        [3, 4],
      ] as unknown as [number, number][],
    };
    const normalized = normalizePolygon(rawPolygon);
    expect(normalized.points).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
