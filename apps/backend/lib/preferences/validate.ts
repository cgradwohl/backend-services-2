import ajv from "~/lib/ajv";

export const schema = {
  additionalProperties: false,
  definitions: {
    channelPreferences: {
      additionalProperties: false,
      properties: {
        channel: {
          enum: ["direct_message", "email", "push"],
          type: "string",
        },
      },
      type: "object",
    },
    preferenceRule: {
      additionalProperties: true,
      properties: {
        type: {
          enum: ["snooze"],
          type: "string",
        },
      },
      required: ["type"],
      type: "object",
    },
    recipientPreferences: {
      additionalProperties: false,
      properties: {
        channel_preferences: {
          items: { $ref: "#/definitions/channelPreferences" },
          type: "array",
          uniqueItemProperties: ["channel"],
        },
        rules: {
          items: {
            anyOf: [{ $ref: "#/definitions/snoozePreference" }],
          },
          type: "array",
        },
        status: {
          enum: ["OPTED_IN", "OPTED_OUT"],
          type: "string",
        },
      },
      required: ["status"],
      type: "object",
    },
    snoozePreference: {
      allOf: [
        {
          $ref: "#/definitions/preferenceRule",
        },
        {
          properties: {
            until: {
              format: "date-time",
              type: "string",
            },
          },
          required: ["until"],
        },
      ],
      type: "object",
    },
  },
  properties: {
    additionalProperties: false,
    categories: {
      additionalProperties: false,
      patternProperties: {
        // regex for uuid
        "^.*$": { $ref: "#/definitions/recipientPreferences" },
      },
      type: "object",
    },
    notifications: {
      additionalProperties: false,
      patternProperties: {
        // regex for uuid
        "^.*$": { $ref: "#/definitions/recipientPreferences" },
      },
      type: "object",
    },
    templateId: {
      type: "string",
    },
  },
  required: ["notifications"],
  type: "object",
};

export default ajv.compile(schema);
