import { unauthorized } from "~/lib/unauthorized";
import { assertJwtScope } from "../assert-jwt-scopes";
import { JwtMiddleware } from "./types";

/** Requires a scope for all brands, or a scope for specific brandId */
export function hasBrandsPermission(type: "read" | "write"): JwtMiddleware {
  return async ({ jwtPayload, event }) => {
    const authorizedScopes = assertJwtScope(jwtPayload);

    if (authorizedScopes.includes(`${type}:brands`)) {
      return;
    }

    const targetBrandId = event.pathParameters?.id;
    if (!targetBrandId) {
      unauthorized();
    }

    const authorizedBrandIds = authorizedScopes
      .filter((scope) => scope.startsWith(`${type}:brands:`))
      .map((scope) => scope.replace(`${type}:brands:`, ""));

    if (!authorizedBrandIds.includes(targetBrandId)) {
      unauthorized();
    }
  };
}
