import { unauthorized } from "~/lib/unauthorized";

/** Calls unauthorized if jwt doesn't have scopes, otherwise returns the individual scopes */
export function assertJwtScope(jwtPayload: { [key: string]: any }): string[] {
  const { scope } = jwtPayload;
  if (typeof scope !== "string") {
    unauthorized();
  }

  return scope.split(" ");
}
