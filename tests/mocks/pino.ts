// Vitest stub for pino to avoid optional dependency issues in tests.
export default function pino() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    destination: () => ({}),
    stdTimeFunctions: { isoTime: () => "" },
  };
}
