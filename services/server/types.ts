/**
 * Symbol registry shared between Inversify bindings and consumers.
 */
export const TYPES = {
  PolygonRepository: Symbol.for("PolygonRepository"),
  PolygonMicroservice: Symbol.for("PolygonMicroservice"),
  Logger: Symbol.for("Logger"),
};
