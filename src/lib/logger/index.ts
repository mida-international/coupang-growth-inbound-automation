import { createLogger } from "@/lib/logger/create-logger";

export const logger = createLogger();

export type { LogLevel, LogContext } from "@/lib/logger/types";
export { createLogger };
