import makeError from "make-error";
import { Unauthorized } from "~/lib/http-errors";
import {
  get as sessionManagementServiceGet,
  namespaceKeys,
} from "~/lib/session-management-service";
import { error } from "../log";

export default async (context, next: () => any) => {
  const key = namespaceKeys.JWT_SIGNATURE;
  const JwtInvalidError = makeError("SessionInvalidError");

  try {
    const token = context.request
      ? context.request.headers.authorization.replace("Bearer ", "")
      : context.event.headers.Authorization.replace("Bearer ", "");

    // jwt signature is a much smaller unique identifier than the entire jwt
    const signature = token.split(".")[2];
    const result = await sessionManagementServiceGet({
      namespace: `${key}:${signature}`,
    });
    if (
      result &&
      result.namespace &&
      result.namespace.replace(`${key}:`, "") === signature
    ) {
      throw new JwtInvalidError("JWT Invalid.");
    }
    if (next) {
      await next();
    }
  } catch (err) {
    error("verify jwt error", err && err.message ? err.message : err);
    if (err instanceof JwtInvalidError) {
      throw new Unauthorized("JWT Invalid.");
    }
  }
};
