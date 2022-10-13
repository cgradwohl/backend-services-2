import { BadRequest } from "~/lib/http-errors";
import { CourierLogger } from "~/lib/logger";
const RequestV2Validator = require("../../../scripts/ajv/request-v2/validate-request-v2");

export function validateV2RequestAjv(request: any): void {
  const { logger } = new CourierLogger("validateV2RequestAjv");
  let validator = RequestV2Validator;
  const valid = validator(request);
  if (!valid) {
    const [{ message, params }] = validator.errors!;
    logger.debug({ message, params });
    throw new BadRequest(message);
  }
}
