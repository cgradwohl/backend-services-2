import { createSchemaValidator } from "~/lib/create-schema-validator";
import { NotificationCategory } from "~/types.api";

export const schema = {
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    json: {
      properties: {
        notificationConfig: {
          properties: {
            type: {
              enum: ["REQUIRED", "OPT_IN", "OPT_OUT"],
              type: "string",
            },
          },
          required: ["type"],
          type: "object",
        },
      },
      required: ["notificationConfig"],
      type: "object",
    },
    title: { type: "string" },
  },
  required: ["title", "json"],
  type: "object",
};

const validator = createSchemaValidator<NotificationCategory>(schema);
export default validator;
