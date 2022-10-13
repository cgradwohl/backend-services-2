import providers from "~/providers";
import { MessageBrandSchema } from "./brand.schema/brand.schema";
import {
  ActionElement,
  ChannelElement,
  DividerElement,
  GroupElement,
  ImageElement,
  MetaElement,
  QuoteElement,
  TextElement,
  HtmlElement,
  CommentElement,
} from "./elemental.schema";
import {
  messageProvidersSchema,
  noAdditionalProps,
  routingChannelsSchema,
  UTM,
} from "./helpers.schema";

const routingChannels = {
  type: "array",
  contains: { type: "string" },
  uniqueItems: true,
  items: { enum: routingChannelsSchema() },
};

const MessageRecipientSchema = {
  type: "object",
  properties: {
    user_id: {
      type: "string",
      format: "noEmptyString",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'user_id'. 'user_id' must be of type string.",
        format: "Invalid Request. The list_pattern must be defined.",
      },
    },
    data: {
      type: "object",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object.",
      },
    },
    phone_number: { type: "string" },
    preferences: { type: "object" },
    list_id: {
      type: "string",
      format: "noEmptyString",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'list_id'. 'list_id' must be of type string.",
        format: "Invalid Request. The list_id must be defined.",
      },
    },
    list_pattern: {
      type: "string",
      format: "noEmptyString",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'list_pattern'. 'list_pattern' must be of type string.",
        format: "Invalid Request. The list_pattern must be defined.",
      },
    },
    audience_id: {
      type: "string",
      format: "noEmptyString",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'audience_id'. 'audience_id' must be of type string.",
        format: "Invalid Request. The audience_id must be defined.",
      },
    },
    email: {
      type: "string",
      format: "email",
      errorMessage: {
        format: "Invalid Request. message.to.email is invalid.",
      },
    },
  },
  anyOf: [
    {
      required: ["email"],
      propertyNames: {
        not: { enum: ["list_id", "list_pattern", "audience_id"] },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
      errorMessage: {
        required: "Invalid Request. The 'to' property must not be empty.",
        format: "Invalid Request. message.to.email is invalid.",
      },
    },
    {
      required: ["user_id"],
      propertyNames: {
        not: { enum: ["list_id", "list_pattern", "audience_id"] },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
    },
    {
      required: ["phone_number"],
      propertyNames: {
        not: { enum: ["list_id", "list_pattern", "audience_id"] },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
    },
    {
      required: ["list_id"],
      propertyNames: {
        not: {
          enum: [
            "list_pattern",
            "audience_id",
            "email",
            "user_id",
            "phone_number",
          ],
        },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
    },
    {
      required: ["list_pattern"],
      propertyNames: {
        not: {
          enum: ["list_id", "audience_id", "email", "user_id", "phone_number"],
        },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
    },
    {
      required: ["audience_id"],
      propertyNames: {
        not: {
          enum: ["list_pattern", "email", "user_id", "phone_number"],
        },
        errorMessage: {
          not: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
        },
      },
    },
  ],
  additionalProperties: true,
  errorMessage: {
    type: "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
    anyOf:
      "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'.",
  },
};

const channelConfig = {
  type: "object",
  properties: {
    brand_id: { type: "string" },
    providers: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        enum: Object.keys(providers),
      },
      uniqueItems: true,
    },
    routing_method: {
      enum: ["single", "all"],
    },
    if: { type: "string" },
    timeout: {
      anyOf: [
        { type: "number" },
        {
          type: "object",
          properties: {
            provider: { type: "number" },
            channel: { type: "number" },
          },
        },
      ],
    },
    override: { type: "object" },
    metadata: {
      type: "object",
      properties: {
        utm: UTM,
      },
    },
  },
  additionalProperties: noAdditionalProps("message.to.channels.channel"),
};

const MAX_TIMEOUT_IN_MS = 259200000;

const MessageSchema = {
  type: "object",
  required: ["to"],
  additionalProperties: noAdditionalProps("message"),
  properties: {
    brand_id: {
      type: "string",
      errorMessage: {
        type: "Invalid definition for property 'brand_id'. 'brand_id' must be of type string.",
      },
    },
    brand: MessageBrandSchema,
    channels: {
      type: "object",
      properties: {
        direct_message: channelConfig,
        email: channelConfig,
        push: channelConfig,
        webhook: channelConfig,
        sms: channelConfig,
      },
      additionalProperties: noAdditionalProps("message.to.channels"),
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'channels'. 'channels' must be of type object.",
        format: "Invalid Request. message.to.email is invalid.",
      },
    },
    content: {
      type: "object",
      additionalProperties: noAdditionalProps("message.content"),
      properties: {
        body: { type: "string" },
        title: { type: "string" },
        version: { type: "string" },
        elements: {
          type: "array",
          minItems: 1,
          items: {
            oneOf: [
              ChannelElement,
              ActionElement,
              DividerElement,
              GroupElement,
              ImageElement,
              MetaElement,
              QuoteElement,
              TextElement,
              HtmlElement,
              CommentElement,
            ],
          },
        },
      },
      anyOf: [
        {
          required: ["body"],
          errorMessage: {
            required:
              "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'",
          },
        },
        {
          required: ["elements"],
          errorMessage: {
            required:
              "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'",
          },
        },
      ],
      dependencies: {
        elements: ["version"],
      },
      errorMessage: {
        dependencies:
          "Invalid Request. 'message.content' must contain a 'version' property when using `content.elements`.",
      },
    },
    data: {
      type: "object",
      errorMessage: {
        type: "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object.",
      },
    },
    delay: {
      type: "object",
      properties: {
        duration: {
          type: "number",
          errorMessage: {
            type: "Invalid definition for property 'message.delay'. 'delay' must be of type number.",
          },
        },
      },
    },
    metadata: {
      type: "object",
      properties: {
        event: {
          type: "string",
          errorMessage: {
            type: "Invalid definition for property 'metadata.event'. 'event' must be of type string.",
          },
        },
        tags: {
          type: "array",
          maxItems: 9,
          items: {
            type: "string",
            maxLength: 30,
            errorMessage: {
              maxLength:
                "Invalid definition for property 'metadata.tags'. Tags cannot be longer than 30 characters.",
            },
          },

          errorMessage: {
            maxItems:
              "Invalid definition for property 'metadata.tags'. Cannot specify more than 9 tags.",
          },
        },
        trace_id: {
          type: "string",
          maxLength: 36,
          errorMessage: {
            maxLength:
              "Invalid definition for property 'metadata.trace_id'. Trace ID cannot be longer than 36 characters.",
            type: "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string.",
          },
        },
        utm: UTM,
      },
      errorMessage: {
        type: "Invalid definition for property 'message.metadata'. 'metadata' must be of type object.",
      },
      additionalProperties: noAdditionalProps("message.metadata"),
    },
    providers: {
      type: "object",
      properties: messageProvidersSchema(),
      additionalProperties: noAdditionalProps("message.to.providers"),
    },
    routing: {
      type: "object",
      properties: {
        method: { enum: ["single", "all"] },
        channels: routingChannels,
      },
      required: ["method"],
      additionalProperties: noAdditionalProps("message.to.routing"),
    },
    template: {
      type: "string",
      errorMessage: {
        type: "Invalid Request. 'template' must be of type string.",
      },
    },
    timeout: {
      type: "object",
      properties: {
        message: {
          type: "number",
          minimum: 0,
          maximum: MAX_TIMEOUT_IN_MS,
          errorMessage: {
            maximum:
              "Invalid definition for property 'timeout.message'. 'message' must be less or equal to 259200000",
            minimum:
              "Invalid definition for property 'timeout.message'. 'message' must be greater or equal to 0",
            type: "Invalid definition for property 'timeout.message'. 'message' must be of type number.",
          },
        },
        channel: {
          anyOf: [
            { type: "number" },
            {
              type: "object",
              patternProperties: {
                "^.*$": {
                  type: "number",
                  minimum: 0,
                  maximum: MAX_TIMEOUT_IN_MS,
                  errorMessage: {
                    maximum:
                      "Invalid definition for property 'timeout.channel'. 'channel' must be less or equal to 259200000",
                    minimum:
                      "Invalid definition for property 'timeout.channel'. 'channel' must be greater or equal to 0",
                    type: "Invalid definition for property 'timeout.channel'. 'channel' must be of type number.",
                  },
                },
              },
              additionalProperties: false,
            },
          ],
          errorMessage: {
            type: "Invalid definition for property 'timeout.channel'. 'channel' must be of type object or number.",
          },
        },
        provider: {
          anyOf: [
            { type: "number" },
            {
              type: "object",
              patternProperties: {
                "^.*$": {
                  type: "number",
                  minimum: 0,
                  maximum: MAX_TIMEOUT_IN_MS,
                  errorMessage: {
                    maximum:
                      "Invalid definition for property 'timeout.provider'. 'provider' must be less or equal to 259200000",
                    minimum:
                      "Invalid definition for property 'timeout.provider'. 'provider' must be greater or equal to 0",
                    type: "Invalid definition for property 'timeout.provider'. 'provider' must be of type number.",
                  },
                },
              },
              additionalProperties: false,
            },
          ],
          errorMessage: {
            type: "Invalid definition for property 'timeout.provider'. 'provider' must be of type object or number.",
          },
        },
      },
      anyOf: [
        {
          required: ["message"],
          errorMessage: {
            required:
              "Invalid Request. The 'message.timeout' property must not be empty.",
          },
        },
        {
          required: ["channel"],
          errorMessage: {
            required:
              "Invalid Request. The 'message.timeout' property must not be empty.",
          },
        },
        {
          required: ["provider"],
          errorMessage: {
            required:
              "Invalid Request. The 'message.timeout' property must not be empty.",
          },
        },
      ],
      additionalProperties: noAdditionalProps("message.timeout"),
      errorMessage: {
        type: "Invalid definition for property 'message.timeout'. 'timeout' must be of type object.",
        anyOf:
          "Invalid Request. The 'message.timeout' property must not be empty.",
      },
    },
    to: {
      if: { type: "array" },
      then: {
        type: "array",
        minItems: 1,
        items: MessageRecipientSchema,
      },
      else: MessageRecipientSchema,
      errorMessage: {
        format: "Invalid Request. message.to.email is invalid.",
      },
    },
  },
  oneOf: [
    {
      required: ["content"],
      errorMessage: {
        required:
          "Invalid Request. Either 'content' or 'template' must be defined.",
      },
    },
    {
      required: ["template"],
      errorMessage: {
        required:
          "Invalid Request. Either 'content' or 'template' must be defined.",
      },
    },
  ],
  errorMessage: {
    type: "Invalid Request. 'message' property must be of type object",
    required: "Invalid Request. The 'to' property is required.",
    oneOf:
      "Invalid Request. Either 'content' or 'template' may be defined, but not both.",
    to: "Invalid Request. The 'to' property must be of type object or array.",
    format: "Invalid Request. message.to.email is invalid.",
  },
};

const SequenceSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      action: {
        enum: ["send"], // TODO: add "cancel", "emit", "fetchData" actions
        errorMessage: {
          enum: "Invalid Request. Only 'send' action is supported at this time.",
        },
      },
      message: MessageSchema,
    },
    required: ["action", "message"],
  },
  minItems: 1,
};

export const RequestV2Schema = {
  type: "object",
  additionalProperties: {
    not: true,
    errorMessage: "Invalid Request. '${0#}' is not a valid request property.",
  },
  properties: {
    message: MessageSchema,
    sequence: SequenceSchema,
  },
  oneOf: [
    {
      required: ["message"],
      errorMessage: {
        required:
          "Invalid Request. Either 'message' or 'sequence' must be defined.",
      },
    },
    {
      required: ["sequence"],
      errorMessage: {
        required:
          "Invalid Request. Either 'message' or 'sequence' must be defined.",
      },
    },
  ],
  errorMessage: {
    type: "Invalid Request. 'message' must be of type object.",
    oneOf:
      "Invalid Request. The request cannot contain both a `sequence` and a `message` property.",
  },
};
