import { unauthorized } from "~/lib/unauthorized";
import { assertJwtScope } from "../assert-jwt-scopes";
import { JwtMiddleware } from "./types";

export function hasScopes(...scopes: string[]): JwtMiddleware {
  return async ({ jwtPayload }) => {
    const authorizedScopes = assertJwtScope(jwtPayload);

    if (!scopes.every((scope) => authorizedScopes.includes(scope))) {
      unauthorized();
    }
  };
}
