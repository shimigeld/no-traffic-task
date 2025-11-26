import type { NextApiRequest, NextApiResponse } from "next";
import { defaultLogger } from "@/lib/logger";
import { container } from "@/services/server/container";
import { TYPES } from "@/services/server/types";
import type { PolygonMicroservice } from "@/services/server/PolygonMicroserviceImpl";

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Handles list/create polygon endpoints, delegating persistence to the DI-backed microservice.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const polygonMicroservice = container.get<PolygonMicroservice>(TYPES.PolygonMicroservice);
  if (req.method === "GET") {
    try {
      const polygons = await polygonMicroservice.getPolygons();
      res.status(200).json(polygons);
    } catch (error: unknown) {
      defaultLogger.error("GET /api/polygons failed", { error: formatError(error) });
      res.status(500).json({ message: "Failed to fetch polygons" });
    }
    return;
  }

  if (req.method === "POST") {
    const { name, points } = req.body as { name?: string; points?: [number, number][] };

    if (!name || !Array.isArray(points) || points.length < 3) {
      defaultLogger.warn("POST /api/polygons rejected payload", { name, pointsLength: Array.isArray(points) ? points.length : null });
      res.status(400).json({ message: "Invalid polygon payload" });
      return;
    }

    const normalizedPoints: [number, number][] = points.map((pair) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error("Invalid point structure");
      }
      return [Number(pair[0]), Number(pair[1])];
    });

    try {
      const polygon = await polygonMicroservice.createPolygon({ name, points: normalizedPoints });
      if (!polygon) {
        defaultLogger.error("POST /api/polygons returned undefined", { name });
        res.status(500).json({ message: "Failed to create polygon" });
        return;
      }
      res.status(201).json(polygon);
    } catch (error: unknown) {
      defaultLogger.error("POST /api/polygons failed", { error: formatError(error), name });
      res.status(500).json({ message: "Failed to create polygon" });
    }
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
