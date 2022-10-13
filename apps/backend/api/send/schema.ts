import Ajv from "ajv";
const ajv = new Ajv({ allErrors: true });

const UserRecipientSchema = {
  type: "object",
  oneOf: [{ required: ["user_id"] }, { required: ["email"] }],
  properties: {
    data: {
      type: "object",
    },
    user_id: {
      type: "string",
    },
    email: {
      type: "string",
    },
  },
  additionalProperties: true,
};

const ListRecipientSchema = {
  type: "object",
  properties: {
    list_id: { type: "string" },
  },
  additionalProperties: false,
};

const MessageRecipientSchema = {
  oneOf: [UserRecipientSchema, ListRecipientSchema],
};

// TODO: should be better schema type
const CourierContentBlockSchema = {
  type: "object",
  additionalProperties: true,
};

const ContentSchema = {
  type: "object",
  anyOf: [{ required: ["body"] }, { required: ["title"] }],
  properties: {
    body: {
      oneOf: [
        { type: "string" },
        {
          type: "array",
          minItems: 1,
          items: CourierContentBlockSchema,
        },
      ],
    },
    title: { type: "string" },
  },
  additionalProperties: false,
};

const ContentMessageSchema = {
  type: "object",
  properties: {
    to: {
      oneOf: [
        MessageRecipientSchema,
        {
          type: "array",
          minItems: 1,
          items: MessageRecipientSchema,
        },
      ],
    },
    content: {
      oneOf: [ContentSchema],
    },
    data: {
      type: "object",
      additionalProperties: true,
    },
  },
  required: ["to", "content"],
  additionalProperties: false,
};

const TemplateMessageSchema = {
  type: "object",
  properties: {
    to: {
      oneOf: [
        MessageRecipientSchema,
        {
          type: "array",
          minItems: 1,
          items: MessageRecipientSchema,
        },
      ],
    },
    template: { type: "string" },
    brand_id: { type: "string" },
    data: {
      type: "object",
      additionalProperties: true,
    },
  },
  required: ["to", "template"],
  additionalProperties: false,
};

const MessageSchema = {
  oneOf: [ContentMessageSchema, TemplateMessageSchema],
};

export const RequestV2Schema = {
  type: "object",
  properties: {
    message: MessageSchema,
  },
  required: ["message"],
  additionalProperties: false,
};

export const validateRequestV2Schema = ajv.compile(RequestV2Schema);
