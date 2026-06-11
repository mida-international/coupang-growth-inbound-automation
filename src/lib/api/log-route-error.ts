import { logger } from "@/lib/logger";

export type RouteErrorContext = {
  route: string;
  method: string;
};

export function logRouteError(error: unknown, context: RouteErrorContext): void {
  logger.error({ err: error, ...context }, "API route failed");
}
