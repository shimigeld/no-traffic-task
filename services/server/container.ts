import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "@/services/server/types";
import { PolygonRepositoryImpl, type PolygonRepository } from "@/services/server/PolygonRepository";
import { PolygonMicroserviceImpl, type PolygonMicroservice } from "@/services/server/PolygonMicroserviceImpl";
import { defaultLogger, type Logger } from "@/lib/logger";

/**
 * Central DI container wiring repositories, microservices, and shared logger instances.
 */
const container = new Container();

container.bind<Logger>(TYPES.Logger).toConstantValue(defaultLogger);
container.bind<PolygonRepository>(TYPES.PolygonRepository).to(PolygonRepositoryImpl).inSingletonScope();
container.bind<PolygonMicroservice>(TYPES.PolygonMicroservice).to(PolygonMicroserviceImpl).inSingletonScope();

export { container };
