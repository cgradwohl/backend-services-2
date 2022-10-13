import { APIGatewayRequestAuthorizerEvent } from "aws-lambda/trigger/api-gateway-authorizer";
import { unauthorized } from "~/lib/unauthorized";
import { assertJwtScope } from "../assert-jwt-scopes";
import { getUserIdsFromScopes } from "../get-user-ids-from-scope";
import { JwtMiddleware } from "./types";

export function hasUserId(
  userIdMapper: (event: APIGatewayRequestAuthorizerEvent) => string
): JwtMiddleware {
  return async ({ jwtPayload, event }) => {
    const userId = userIdMapper(event);
    if (!userId) {
      unauthorized();
    }

    const authorizedScopes = assertJwtScope(jwtPayload);
    const allowedUserIds = getUserIdsFromScopes(authorizedScopes);

    if (!allowedUserIds.includes(userId)) {
      unauthorized();
    }
  };
}
