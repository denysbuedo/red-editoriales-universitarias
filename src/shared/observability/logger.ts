type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

interface LogEvent {
  level: LogLevel;
  service: "pnpu-portal";
  event: string;
  correlationId?: string;
  method?: string;
  path?: string;
}

interface LoggerEnvironment {
  [key: string]: string | undefined;
  PNPU_ENABLE_REQUEST_LOGS?: string;
  PNPU_LOG_LEVEL?: string;
}

function resolveLogLevel(environment: LoggerEnvironment): LogLevel {
  const configuredLevel = environment.PNPU_LOG_LEVEL?.toLowerCase();

  if (
    configuredLevel === "debug" ||
    configuredLevel === "info" ||
    configuredLevel === "warn" ||
    configuredLevel === "error"
  ) {
    return configuredLevel;
  }

  return "info";
}

export function areRequestLogsEnabled(environment: LoggerEnvironment = process.env): boolean {
  return environment.PNPU_ENABLE_REQUEST_LOGS !== "false";
}

export function shouldLog(level: LogLevel, environment: LoggerEnvironment = process.env): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[resolveLogLevel(environment)];
}

export function writeStructuredLog(
  event: LogEvent,
  environment: LoggerEnvironment = process.env,
): void {
  if (!shouldLog(event.level, environment)) {
    return;
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}
