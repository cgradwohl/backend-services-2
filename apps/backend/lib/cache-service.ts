import LRU from "lru-cache";
import logger from "./logger";

const DEFAULT_MAX_AGE = 1000 * 30;

export function cacheService() {
  const options = {
    max: 100,
    maxAge: DEFAULT_MAX_AGE,
  };

  const cache = new LRU(options);

  return {
    get: async <T>(
      identifier: string,
      fallbackFn,
      cacheDuration = 0 // defaulting zero means do not cache anything
    ): Promise<T> => {
      const enableCache = cacheDuration > 0;

      if (enableCache) {
        if (cache.has(identifier)) {
          logger.debug(`Cache hit: ${identifier}`);
          return cache.get(identifier) as T;
        }
      }

      const freshResults = await fallbackFn();

      if (enableCache) {
        logger.debug(
          `Cache missed for:- ${identifier}, updating the cache with maxAge ${cacheDuration}`
        );
        cache.set(identifier, freshResults, cacheDuration || DEFAULT_MAX_AGE);
      }

      return freshResults;
    },
  };
}
