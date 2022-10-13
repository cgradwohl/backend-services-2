import logger from "~/lib/logger";

export default function log(...args: Parameters<typeof logger.debug>) {
  logger.debug(...args);
}

export function error(...args: Parameters<typeof logger.error>) {
  logger.error(...args);
}

export function warn(...args: Parameters<typeof logger.warn>) {
  logger.warn(...args);
}

export function fatal(...args: Parameters<typeof logger.fatal>) {
  logger.fatal(...args);
}

export function info(...args: Parameters<typeof logger.info>) {
  logger.info(...args);
}
