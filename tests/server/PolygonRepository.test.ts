import { describe, expect, it, beforeEach, vi } from "vitest";
import { PolygonRepositoryImpl } from "@/services/server/PolygonRepository";
import { fetchPolygons, insertPolygon, removePolygon } from "@/lib/db";
import type { Polygon } from "@/types/polygon";

vi.mock("@/lib/db", () => ({
  fetchPolygons: vi.fn(),
  insertPolygon: vi.fn(),
  removePolygon: vi.fn(),
}));

describe("PolygonRepositoryImpl", () => {
  const repository = new PolygonRepositoryImpl();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all polygons via db helper", async () => {
    const polygons: Polygon[] = [
      { id: "1", name: "One", points: [[0, 0], [1, 1], [1, 0]] },
    ];
    vi.mocked(fetchPolygons).mockResolvedValue(polygons);

    const result = await repository.fetchAll();

    expect(result).toEqual(polygons);
    expect(fetchPolygons).toHaveBeenCalledTimes(1);
  });

  it("inserts polygons via db helper", async () => {
    const polygon: Polygon = { id: "2", name: "Two", points: [[0, 0], [1, 0], [0, 1]] };
    vi.mocked(insertPolygon).mockResolvedValue(polygon);

    const result = await repository.insert(polygon.name, polygon.points);

    expect(result).toEqual(polygon);
    expect(insertPolygon).toHaveBeenCalledWith(polygon.name, polygon.points);
  });

  it("removes polygons via db helper", async () => {
    vi.mocked(removePolygon).mockResolvedValue(true);

    const result = await repository.remove("99");

    expect(result).toBe(true);
    expect(removePolygon).toHaveBeenCalledWith("99");
  });
});
