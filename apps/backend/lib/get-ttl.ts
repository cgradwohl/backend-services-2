import { addSeconds, add, Duration } from "date-fns";

type GetTtlFn = (
  retryCount: number,
  overrides?: { date?: number; intervalMap?: Map<number, number> }
) => number;

const maxRetriesBeforeBackoff = 10;
const maxHourDecay = 3;

/*
  For a given retry count, gets the ttl in seconds against the current time.
  Overrides include setting a base time to add a ttl against and setting
  the interval in minutes for a given retry count.
*/
const getTtl: GetTtlFn = (retryCount, overrides) => {
  // Set the interval to one hour if the retry count is gt 10
  let interval: number = retryCount > 10 ? 60 : undefined;

  if (overrides?.intervalMap?.has(retryCount)) {
    interval = overrides?.intervalMap?.get(retryCount);
  }

  // We do not want to propose a TTL if there is no interval.
  if (interval === undefined) {
    return undefined;
  }

  const factor = Math.max(retryCount - maxRetriesBeforeBackoff, 1);
  const multiplicand = 60 * interval;
  const multiplier = factor > maxHourDecay ? maxHourDecay : factor;
  const timeToAdd = multiplicand * multiplier;
  const baseTime = overrides?.date ?? Date.now();

  return Math.floor(addSeconds(baseTime, timeToAdd).getTime() / 1000);
};

export const getTtlFromNow = (duration: Duration): number =>
  Math.floor(add(Date.now(), duration).getTime() / 1000);

export default getTtl;
