import { createSchemaValidator } from "~/lib/create-schema-validator";

import { IInboundSegmentTrackRequest } from "../types";

export const segmentTrackRequestSchema = {
  additionalProperties: true,
  anyOf: [{ required: ["anonymousId"] }, { required: ["userId"] }],
  properties: {
    action: { type: ["string"] }, // used on b2b saas events
    anonymousId: { type: ["string", "null"] },
    context: { type: "object" },
    event: { type: "string" },
    messageId: { type: "string" },
    properties: { type: "object" },
    receivedAt: { type: "string" },
    timestamp: { type: "string" },
    type: { type: "string" },
    userId: { type: ["string", "null"] },
  },
  required: ["event", "type"],
  type: "object",
};

const validateSegmentTrackRequest = createSchemaValidator<
  IInboundSegmentTrackRequest
>(segmentTrackRequestSchema);

export default validateSegmentTrackRequest;
