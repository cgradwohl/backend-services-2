import { createSchemaValidator } from "~/lib/create-schema-validator";

import { IInboundSegmentGroupRequest } from "../types";

export const segmentIdentifyRequestSchema = {
  additionalProperties: true,
  anyOf: [{ required: ["anonymousId"] }, { required: ["userId"] }],
  properties: {
    anonymousId: { type: ["string", "null"] },
    messageId: { type: "string" },
    receivedAt: { type: "string" },
    timestamp: { type: "string" },
    traits: { type: "object" },
    type: { type: "string" },
    userId: { type: ["string", "null"] },
  },
  required: ["traits", "type", "groupId"],
  type: "object",
};

const validateSegmentIdentifyRequest = createSchemaValidator<
  IInboundSegmentGroupRequest
>(segmentIdentifyRequestSchema);

export default validateSegmentIdentifyRequest;
