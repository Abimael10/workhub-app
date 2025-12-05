type LoggerLike = {
  info: (obj: unknown) => void;
  warn: (obj: unknown) => void;
  error: (obj: unknown) => void;
};

const consoleLogger: LoggerLike = {
  info: (obj) => console.info(obj),
  warn: (obj) => console.warn(obj),
  error: (obj) => console.error(obj),
};

export const appLogger: LoggerLike = consoleLogger;
