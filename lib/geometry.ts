import type { Polygon } from "@/types/polygon";

export type Point = [number, number];

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const polygonCentroid = (points: Point[]): Point => {
  if (!points.length) return [0, 0];
  const sum = points.reduce(
    (acc, [x, y]) => {
      acc[0] += x;
      acc[1] += y;
      return acc;
    },
    [0, 0] as Point,
  );
  return [sum[0] / points.length, sum[1] / points.length];
};

export const polygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

export const normalizePolygon = (polygon: Polygon): Polygon => ({
  ...polygon,
  points: polygon.points.map(([x, y]) => [Number(x), Number(y)] as Point),
});
