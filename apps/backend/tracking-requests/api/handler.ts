import { BadRequest } from "~/lib/http-errors";
import { assertBody, handleIdempotentApi } from "~/lib/lambda-response";
import createTraceId from "~/lib/x-ray/create-trace-id";
import trackingRequests from "../services/tracking-requests";
import { NewTrackingRequest } from "../types";

export default handleIdempotentApi(async (context) => {
  const { dryRunKey, scope, tenantId } = context;
  const body = assertBody<NewTrackingRequest>(context);
  const { event, override, user } = body;

  if (override) {
    throw new BadRequest(
      "Invalid request property. 'override' is only applicable to send and send-list steps."
    );
  }

  if (!event) {
    throw new BadRequest("The 'event' parameter is required.");
  }

  if (typeof event !== "string") {
    throw new BadRequest("The 'event' parameter must be a string.");
  }

  if (!user) {
    throw new BadRequest("The 'user' parameter must be provided.");
  }

  if (typeof user !== "string") {
    throw new BadRequest("The 'user' parameter must be a string.");
  }

  const trackingId = createTraceId();
  await trackingRequests(tenantId, scope, dryRunKey).create(trackingId, body);

  return {
    body: {
      trackingId,
      trackId: trackingId, // added for back-compat. remove once office vibe is off
    },
    status: 202,
  };
});
