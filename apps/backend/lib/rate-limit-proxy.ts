import { ApiErrorResponse } from "~/types.public";

import { TooManyRequests } from "./http-errors";
import { ApiRequestContext } from "./lambda-response";
import RateLimiterDynamo from "./rate-limiter-dynamo";
import rateLimitsService, { createKey } from "./rate-limits-service";

const POINTS = 20;

type RateLimitProxyFn<T extends (...args: any) => any> = (
  fn: T
) => (...args: Parameters<T>) => ReturnType<T>;
type ApiRateLimitProxyFn = RateLimitProxyFn<
  (context: ApiRequestContext) => Promise<IApiResponse | ApiErrorResponse>
>;
interface IApiResponse {
  body?: string | number | any[] | { [key: string]: any };
  status?: number;
}

const enforceRateLimit: ApiRateLimitProxyFn = (func) => async (context) => {
  try {
    const { tenantId } = context;
    const rateLimiter = new RateLimiterDynamo({
      duration: 60, // per 1 minute
      keyPrefix: "",
      points: POINTS, // requests for tenant
      storeClient: rateLimitsService,
      tenantId,
      userId: `tenant/${tenantId}`,
    });

    const key = createKey("tenant-id", tenantId, "objects");
    const rateLimitStatus = await rateLimiter.consume(key, 1);
    const result = await func(context);

    return {
      ...result,
      headers: {
        "X-RateLimit-Limit": POINTS,
        "X-RateLimit-Remaining": rateLimitStatus.remainingPoints,
      },
    };
  } catch (err) {
    if ("remainingPoints" in err) {
      const headers = {
        "X-RateLimit-Limit": POINTS,
        "X-RateLimit-Remaining": err.remainingPoints,
      };

      throw new TooManyRequests("Too Many Requests", { headers });
    }

    throw err;
  }
};

export default enforceRateLimit;
