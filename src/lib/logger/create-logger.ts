import pino from "pino";

import type { LogLevel } from "@/lib/logger/types";

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

function resolveLogLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL;

  if (fromEnv && LOG_LEVELS.includes(fromEnv as LogLevel)) {
    return fromEnv as LogLevel;
  }

  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

export function createLogger() {
  const level = resolveLogLevel();
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return pino({
      level,
      name: "app",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
  }

  return pino({
    level,
    name: "app",
  });
}
