type LogLevel = "info" | "warn" | "error";

type LogContext = {
  domain: string;
  operation: string;
  orgId?: string;
  meta?: Record<string, unknown>;
};

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    ...context,
    msg: message,
    err: error instanceof Error ? { message: error.message, stack: error.stack } : undefined,
  };

  switch (level) {
    case "info":
      console.log(JSON.stringify(payload));
      break;
    case "warn":
      console.warn(JSON.stringify(payload));
      break;
    case "error":
      console.error(JSON.stringify(payload));
      break;
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext, error?: unknown) {
    emit("warn", message, context, error);
  },
  error(message: string, context?: LogContext, error?: unknown) {
    emit("error", message, context, error);
  },
};
