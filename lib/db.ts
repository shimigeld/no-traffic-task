import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoLite from "mongo-lite";
import type { Polygon } from "@/types/polygon";

/**
 * Data-access helpers that prefer mongo-lite but gracefully fall back to JSON file storage.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "polygons.json");
const COLLECTION_NAME = "polygons";
const DEFAULT_URL = process.env.MONGO_URL ?? "mongodb://127.0.0.1:27017/no-traffic-polygons";

type MongoLiteDb = ReturnType<typeof mongoLite.connect>;
type MongoLiteCollection = MongoLiteDb[string];
type MongoPolygonDoc = {
  _id?: string;
  id?: string | number;
  name: string;
  points: [number, number][];
};

// mongo-lite ships without types, so we treat the connection as unknown.
let mongoDb: MongoLiteDb | null = null;
try {
  mongoDb = mongoLite.connect(DEFAULT_URL, [COLLECTION_NAME]);
} catch (error: unknown) {
  console.warn("mongo-lite: falling back to file storage", error);
}

let fallbackCache: Polygon[] | null = null;

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
};

const readFallback = async (): Promise<Polygon[]> => {
  if (fallbackCache) {
    return fallbackCache;
  }
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  fallbackCache = JSON.parse(raw) as Polygon[];
  return fallbackCache ?? [];
};

const writeFallback = async (data: Polygon[]) => {
  fallbackCache = data;
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
};

const toPolygon = (doc: MongoPolygonDoc): Polygon => ({
  id: doc._id?.toString() ?? doc.id?.toString() ?? randomUUID(),
  name: doc.name,
  points: doc.points,
});

const sanitizePoints = (points: Polygon["points"]) =>
  points.map(([x, y]: [number, number]) => [Number(x), Number(y)] as [number, number]);

async function tryMongo<T>(operation: (collection: MongoLiteCollection) => Promise<T>): Promise<T | null> {
  if (!mongoDb) return null;
  try {
    return await operation(mongoDb[COLLECTION_NAME]);
  } catch (error: unknown) {
    console.warn("mongo-lite operation failed, using fallback", error);
    return null;
  }
}

export async function fetchPolygons(): Promise<Polygon[]> {
  const mongoResult = await tryMongo<Polygon[]>(
    (collection) =>
      new Promise((resolve, reject) => {
        collection
          .find({})
          .all((err: Error | null, docs) => {
            if (err) return reject(err);
            resolve(docs.map((doc) => toPolygon(doc as MongoPolygonDoc)));
          });
      }),
  );

  if (mongoResult) return mongoResult;
  const fallback = await readFallback();
  return fallback;
}

export async function insertPolygon(name: string, points: Polygon["points"]): Promise<Polygon> {
  const sanitized = sanitizePoints(points);
  const recordId = randomUUID();
  const payload = { _id: recordId, name, points: sanitized };
  const mongoResult = await tryMongo<Polygon>(
    (collection) =>
      new Promise((resolve, reject) => {
        collection.insert(payload, (err: Error | null, doc) => {
          if (err) return reject(err);
          resolve(toPolygon(doc as MongoPolygonDoc));
        });
      }),
  );

  if (mongoResult) return mongoResult;

  const record: Polygon = {
    id: recordId,
    name,
    points: sanitized,
  };
  const fallback = await readFallback();
  const next = [...fallback, record];
  await writeFallback(next);
  return record;
}

export async function removePolygon(id: string): Promise<boolean> {
  const mongoResult = await tryMongo<boolean>(
    (collection) =>
      new Promise((resolve, reject) => {
        collection.remove({ _id: id }, (err: Error | null) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      }),
  );

  if (mongoResult) {
    return mongoResult;
  }

  const fallback = await readFallback();
  const next = fallback.filter((poly) => poly.id !== id);
  const updated = next.length !== fallback.length;
  await writeFallback(next);
  return updated;
}
