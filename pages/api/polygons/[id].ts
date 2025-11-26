import type { NextApiRequest, NextApiResponse } from "next";
import { defaultLogger } from "@/lib/logger";
import { container } from "@/services/server/container";
import { TYPES } from "@/services/server/types";
import type { PolygonMicroservice } from "@/services/server/PolygonMicroserviceImpl";

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Handles deletion of a single polygon resource, validating ids before dispatching to the microservice.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const polygonMicroservice = container.get<PolygonMicroservice>(TYPES.PolygonMicroservice);
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    defaultLogger.warn("DELETE /api/polygons invalid id", { id });
    res.status(400).json({ message: "Invalid polygon id" });
    return;
  }

  try {
    const removed = await polygonMicroservice.deletePolygon(id);
    if (!removed) {
      res.status(404).json({ message: "Polygon not found" });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    defaultLogger.error(`DELETE /api/polygons/${id} failed`, { error: formatError(error) });
    res.status(500).json({ message: "Failed to delete polygon" });
  }
}
