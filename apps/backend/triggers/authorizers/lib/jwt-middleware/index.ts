import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { hasScopes } from "./has-scopes";
import { mapUserIdFromIdPathParam } from "../mappers";
import { JwtMiddlewareMap } from "./types";
import { hasUserId } from "./has-user-id";
import { hasBrandsPermission } from "./has-brands-permission";
import { unauthorized } from "~/lib/unauthorized";

/** Endpoints that can be authorized by a Client JWT  */
export const jwtMiddleware: JwtMiddlewareMap = {
  "/users/{id}/tokens/{token}": {
    GET: [hasScopes("read:user-tokens"), hasUserId(mapUserIdFromIdPathParam)],
    PUT: [hasScopes("write:user-tokens"), hasUserId(mapUserIdFromIdPathParam)],
    DELETE: [
      hasScopes("write:user-tokens"),
      hasUserId(mapUserIdFromIdPathParam),
    ],
  },
  "/brands": {
    GET: [hasScopes("read:brands")],
  },
  "/brands/{id}": {
    GET: [hasBrandsPermission("read")],
    DELETE: [hasBrandsPermission("write")],
    PUT: [hasBrandsPermission("write")],
  },
};

/** Validates jwt payload against request with registered middleware */
export async function runJwtMiddleware(
  event: APIGatewayRequestAuthorizerEvent,
  jwtPayload: { [key: string]: any }
): Promise<void> {
  const { resource, httpMethod } = event;
  const endpoint = jwtMiddleware[resource];
  if (!endpoint) {
    unauthorized();
  }

  const middleware = endpoint[httpMethod];
  if (!middleware) {
    unauthorized();
  }

  const proms = middleware.map((middleware) =>
    middleware({ event, jwtPayload })
  );

  await Promise.all(proms);
}
