import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "@/services/server/types";
import type { PolygonRepository } from "@/services/server/PolygonRepository";
import type { Logger } from "@/lib/logger";
import type { Polygon } from "@/types/polygon";

/**
 * Contract describing business operations available to the polygon HTTP handlers.
 */
export interface PolygonMicroservice {
  getPolygons(): Promise<Polygon[]>;
  createPolygon(payload: { name: string; points: Polygon["points"] }): Promise<Polygon>;
  deletePolygon(id: string): Promise<boolean>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Concrete polygon microservice that adds latency simulation and logging around repository calls.
 */
@injectable()
export class PolygonMicroserviceImpl implements PolygonMicroservice {
  private delayMs: number;

  constructor(
    @inject(TYPES.PolygonRepository) private repository: PolygonRepository,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    this.delayMs = 5000;
  }

  private async maybeDelay() {
    if (this.delayMs > 0) {
      await wait(this.delayMs);
    }
  }

  async getPolygons(): Promise<Polygon[]> {
    try {
      await this.maybeDelay();
      return await this.repository.fetchAll();
    } catch (error) {
      this.logger.error("PolygonMicroservice#getPolygons failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async createPolygon({ name, points }: { name: string; points: Polygon["points"] }): Promise<Polygon> {
    try {
      await this.maybeDelay();
      return await this.repository.insert(name, points);
    } catch (error) {
      this.logger.error("PolygonMicroservice#createPolygon failed", {
        error: error instanceof Error ? error.message : String(error),
        name,
      });
      throw error;
    }
  }

  async deletePolygon(id: string): Promise<boolean> {
    try {
      await this.maybeDelay();
      return await this.repository.remove(id);
    } catch (error) {
      this.logger.error("PolygonMicroservice#deletePolygon failed", {
        error: error instanceof Error ? error.message : String(error),
        id,
      });
      throw error;
    }
  }
}
