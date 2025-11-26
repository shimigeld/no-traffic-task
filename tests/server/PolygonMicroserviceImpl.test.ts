import { describe, expect, it, beforeEach, vi, type Mock } from "vitest";
import { PolygonMicroserviceImpl } from "@/services/server/PolygonMicroserviceImpl";
import type { PolygonRepository } from "@/services/server/PolygonRepository";
import type { Logger } from "@/lib/logger";
import type { Polygon } from "@/types/polygon";

const samplePolygon: Polygon = {
  id: "poly-1",
  name: "Sample",
  points: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
};

type RepositoryMock = PolygonRepository & {
  fetchAll: Mock<() => Promise<Polygon[]>>;
  insert: Mock<(name: string, points: Polygon["points"]) => Promise<Polygon>>;
  remove: Mock<(id: string) => Promise<boolean>>;
};

describe("PolygonMicroserviceImpl", () => {
  let repository: RepositoryMock;
  let logger: Logger;
  let service: PolygonMicroserviceImpl;

  beforeEach(() => {
    repository = {
      fetchAll: vi.fn(),
      insert: vi.fn(),
      remove: vi.fn(),
    } as RepositoryMock;
    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    service = new PolygonMicroserviceImpl(repository, logger);
    // Remove artificial delay so tests are fast
    (service as unknown as { delayMs: number }).delayMs = 0;
  });

  it("returns polygons from the repository", async () => {
    vi.mocked(repository.fetchAll).mockResolvedValue([samplePolygon]);

    const result = await service.getPolygons();

    expect(result).toEqual([samplePolygon]);
    expect(repository.fetchAll).toHaveBeenCalledTimes(1);
  });

  it("logs and rethrows errors when fetching polygons fails", async () => {
    const error = new Error("boom");
    vi.mocked(repository.fetchAll).mockRejectedValue(error);

    await expect(service.getPolygons()).rejects.toThrow(error);
    expect(logger.error).toHaveBeenCalledWith("PolygonMicroservice#getPolygons failed", {
      error: error.message,
    });
  });

  it("creates polygons and forwards payload", async () => {
    vi.mocked(repository.insert).mockResolvedValue(samplePolygon);

    const payload = { name: samplePolygon.name, points: samplePolygon.points };
    const result = await service.createPolygon(payload);

    expect(result).toEqual(samplePolygon);
    expect(repository.insert).toHaveBeenCalledWith(payload.name, payload.points);
  });

  it("logs name context when create fails", async () => {
    const error = new Error("insert failed");
    vi.mocked(repository.insert).mockRejectedValue(error);

    await expect(service.createPolygon({ name: "Bad", points: samplePolygon.points })).rejects.toThrow(
      error,
    );
    expect(logger.error).toHaveBeenCalledWith("PolygonMicroservice#createPolygon failed", {
      error: error.message,
      name: "Bad",
    });
  });

  it("deletes polygons and returns boolean result", async () => {
    vi.mocked(repository.remove).mockResolvedValue(true);

    const result = await service.deletePolygon("poly-1");

    expect(result).toBe(true);
    expect(repository.remove).toHaveBeenCalledWith("poly-1");
  });

  it("logs identifier when delete fails", async () => {
    const error = new Error("delete failed");
    vi.mocked(repository.remove).mockRejectedValue(error);

    await expect(service.deletePolygon("oops")).rejects.toThrow(error);
    expect(logger.error).toHaveBeenCalledWith("PolygonMicroservice#deletePolygon failed", {
      error: error.message,
      id: "oops",
    });
  });
});
