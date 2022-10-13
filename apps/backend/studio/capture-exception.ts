import { Context } from "koa";
import { HttpError } from "~/lib/http-errors";
import capture from "../lib/capture-exception";

type Next = () => Promise<any>;
export default async function captureException(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    const msg = err && err.message ? err.message : err;
    const statusCode = err.statusCode || 500;
    const isClientError =
      HttpError.isClientError(statusCode) && err instanceof HttpError;
    const safeErrorMessage = isClientError ? msg : "Internal Server Error";

    if (!isClientError) {
      console.error(err);
    }

    ctx.status = statusCode;
    ctx.body = safeErrorMessage;

    await capture(err, {
      request: ctx.request,
      user: {
        id: ctx?.userContext?.userId,
        tenantId: ctx?.userContext?.tenantId,
        userPoolId: ctx?.userContext?.userPoolId,
      },
    });
  }
}
