import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";

import { assertBody } from "~/lib/koa-assert";
import { BadRequest, TooManyRequests } from "../http-errors";
import { ApiRequestContext } from "../lambda-response";
import RateLimiterDynamo from "../rate-limiter-dynamo";
import rateLimitsService, { createKey } from "../rate-limits-service";
import { RateLimitType } from "../rate-limits-service/types";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;

export default (type: RateLimitType) => async (
  context: Context,
  next: () => Promise<void>
) => {
  let points: number;
  let duration: number;
  switch (type) {
    case "objects":
    case "tenant/request":
      points = 20;
      duration = 60; // One minute
      break;
    case "invites":
      points = 50;
      duration = 60 * 15; // Fifteen minutes
      break;
    case "bulk-invites":
      points = 5;
      duration = 60; // One minute
      break;
    case "onboarding/info":
      points = 5;
      duration = 60 * 10; // Ten minutes
      break;
    case "login":
    case "login/verify":
      points = 5;
      duration = 60 * 10; // Ten minutes
  }

  try {
    const itemOrArray = getUserDetails(context, type);
    const details = Array.isArray(itemOrArray) ? itemOrArray : [itemOrArray];

    let remainingPoints: number;

    for (const detail of details) {
      const { key, tenantId, userId } = detail;

      const rateLimiter = new RateLimiterDynamo({
        duration,
        keyPrefix: "",
        points,
        storeClient: rateLimitsService,
        tenantId,
        userId,
      });

      const result = await rateLimiter.consume(key, 1);

      if (remainingPoints === undefined) {
        remainingPoints = parseInt(result.remainingPoints, 10);
      } else {
        const resultRemainingPoints = parseInt(result.remainingPoints, 10);

        if (resultRemainingPoints < remainingPoints) {
          remainingPoints = resultRemainingPoints;
        }
      }
    }

    context.set("X-RateLimit-Limit", String(points));
    context.set("X-RateLimit-Remaining", String(remainingPoints));

    await next();
  } catch (err) {
    if ("remainingPoints" in err) {
      throw new TooManyRequests("Too Many Requests", {
        headers: {
          "X-RateLimit-Limit": String(points),
          "X-RateLimit-Remaining": err.remainingPoints,
        },
      });
    }

    throw err;
  }
};

interface IUserDetails {
  key: string;
  tenantId: string;
  userId: string;
}

const getUserDetails = (
  context: Context,
  type: RateLimitType
): IUserDetails | IUserDetails[] => {
  let key: string;
  let tenantId: string;
  let userId: string;

  const { event } = (context.req as unknown) as ApiRequestContext;
  const ip = event.requestContext.identity.sourceIp;

  switch (type) {
    case "invites":
    case "bulk-invites":
    case "objects":
    case "onboarding/info":
    case "tenant/request":
      const { userContext } = context;
      tenantId = userContext.tenantId;
      userId = userContext.userId;
      key = createKey("tenant-id", tenantId, type);
      break;
    case "login":
      const { email } = assertBody(context) as { email: string };
      if (!email) {
        throw new BadRequest("Email address is required");
      }

      return [
        {
          key: createKey("ip", `ip/${ip}`, type),
          tenantId: `ip/${ip}`,
          userId: `ip/${ip}`,
        },
        {
          key: createKey("email", `email/${email}`, type),
          tenantId: `email/${email}`,
          userId: `email/${email}`,
        },
      ];

    case "login/verify":
      tenantId = `ip/${ip}`;
      userId = `ip/${ip}`;
      key = createKey("ip", tenantId, type);
      break;
  }

  return { key, tenantId, userId };
};
