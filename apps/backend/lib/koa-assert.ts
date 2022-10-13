import { ValidateFunction } from "ajv";
import { Context } from "koa";

import { BadRequest } from "~/lib/http-errors";
import { extractErrors } from "./ajv";
import logger from "./logger";

export const assertBody = <T>(
  ctx: Context,
  validateFn?: ValidateFunction
): T => {
  if (!ctx.request || !ctx.request.body) {
    throw new BadRequest("Body required");
  }

  const { body } = ctx.request;

  if (validateFn) {
    const valid = validateFn(body);

    if (!valid) {
      const errors = extractErrors(validateFn.schema, body, validateFn.errors);
      logger.error(errors); // We need to be noisy on purpose for a bit
      throw new BadRequest(JSON.stringify(errors));
    }
  }

  return body as T;
};

export const assertPathParam = (ctx: Context, param: string): string => {
  if (!ctx.params || !ctx.params[param]) {
    throw new BadRequest("No Path Parameter Provided");
  }
  return ctx.params[param];
};
