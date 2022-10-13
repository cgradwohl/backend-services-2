import qs from "qs";

import { BadRequest } from "~/lib/http-errors";
import { warn } from "~/lib/log";

const parseSlackWebhookBody = (body: string): unknown => {
  try {
    return JSON.parse(qs.parse(body).payload);
  } catch (err) {
    warn("Failed to parse webhook body", body, err);
    throw new BadRequest("Body could not be parsed");
  }
};

export default parseSlackWebhookBody;
