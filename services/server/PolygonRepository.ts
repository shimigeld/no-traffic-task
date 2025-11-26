import "reflect-metadata";
import { injectable } from "inversify";
import { fetchPolygons, insertPolygon, removePolygon } from "@/lib/db";
import type { Polygon } from "@/types/polygon";

/**
 * Abstraction that surfaces persistence operations for polygons regardless of backing store.
 */
export interface PolygonRepository {
  fetchAll(): Promise<Polygon[]>;
  insert(name: string, points: Polygon["points"]): Promise<Polygon>;
  remove(id: string): Promise<boolean>;
}

/**
 * Inversify-bound repository that reuses the mongo-lite + file-system helpers.
 */
@injectable()
export class PolygonRepositoryImpl implements PolygonRepository {
  async fetchAll(): Promise<Polygon[]> {
    return await fetchPolygons();
  }

  async insert(name: string, points: Polygon["points"]): Promise<Polygon> {
    return await insertPolygon(name, points);
  }

  async remove(id: string): Promise<boolean> {
    return await removePolygon(id);
  }
}
