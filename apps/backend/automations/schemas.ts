import {
  IAutomationSchemaConfig,
  ISchemaValidationMethods,
} from "~/automations/types";

import Ajv from "ajv";
const addFormats = require("ajv-formats");
const ajv = new Ajv();
addFormats(ajv);

export default (config: IAutomationSchemaConfig): ISchemaValidationMethods => {
  const { additionalProperties } = config;

  const accessorTypeSchema = {
    type: "object",
    properties: {
      $ref: { type: "string" },
    },
    additionalProperties,
    required: ["$ref"],
  };

  const allowAccessor = (obj) => ({ anyOf: [obj, accessorTypeSchema] });

  const webhookSchema = {
    type: "object",
    properties: {
      body: { type: "object" },
      headers: { type: "object" },
      params: { type: "object" },
      method: allowAccessor({ enum: ["GET", "get", "POST", "post"] }),
      url: allowAccessor({ type: "string", minLength: 1 }),
    },
    additionalProperties,
    required: ["url"],
  };

  const sendSchema = {
    type: "object",
    properties: {
      action: { enum: ["send"] },
      template: allowAccessor({ type: "string", minLength: 1 }),
      recipient: allowAccessor({ type: "string", minLength: 1 }),
      profile: { type: "object" },
      brand: allowAccessor({ type: "string" }),
      idempotency_expiry: allowAccessor({ type: "string" }),
      idempotency_key: allowAccessor({ type: "string" }),
      data: { type: "object" },
      override: { type: "object" },
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
    },
    additionalProperties,
    required: ["action", "template", "recipient"],
  };

  const sendListSchema = {
    type: "object",
    properties: {
      action: { enum: ["send-list"] },
      template: allowAccessor({ type: "string", minLength: 1 }),
      list: allowAccessor({ type: "string", minLength: 1 }),
      brand: allowAccessor({ type: "string" }),
      idempotency_expiry: allowAccessor({ type: "string" }),
      idempotency_key: allowAccessor({ type: "string" }),
      data: { type: "object" },
      override: { type: "object" },
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
      data_source: allowAccessor({
        type: "object",
        properties: {
          webhook: allowAccessor(webhookSchema),
          merge_strategy: allowAccessor({
            enum: ["replace", "overwrite", "soft-merge", "none"],
          }),
        },
        additionalProperties,
        required: ["webhook", "merge_strategy"],
      }),
    },
    additionalProperties,
    required: ["action", "template", "list"],
  };

  const delayParameterOptions = ["duration", "until", "delayFor", "delayUntil"];
  const delaySchema = {
    anyOf: delayParameterOptions.map((delayParameter) => {
      switch (delayParameter) {
        case "until" || "delayUntil":
          return {
            type: "object",
            properties: {
              action: { enum: ["delay"] },
              [delayParameter]: allowAccessor({
                type: "string",
                format: "date-time",
                minLength: 1,
              }),
              if: allowAccessor({ type: "string" }),
              ref: allowAccessor({ type: "string" }),
            },
            additionalProperties,
            required: ["action", delayParameter],
          };

        default:
          return {
            type: "object",
            properties: {
              action: { enum: ["delay"] },
              [delayParameter]: allowAccessor({ type: "string", minLength: 1 }),
              if: allowAccessor({ type: "string" }),
              ref: allowAccessor({ type: "string" }),
            },
            additionalProperties,
            required: ["action", delayParameter],
          };
      }
    }),
  };

  const invokeSchema = {
    type: "object",
    properties: {
      action: { enum: ["invoke"] },
      context: allowAccessor({
        type: "object",
        properties: {
          brand: allowAccessor({ type: "string" }),
          data: { type: "object" },
          profile: { type: "object" },
          template: allowAccessor({ type: "string" }),
          recipient: allowAccessor({ type: "string" }),
        },
        additionalProperties,
      }),
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
      template: allowAccessor({ type: "string", minLength: 1 }),
    },
    additionalProperties,
    required: ["action", "template"],
  };

  const cancelationTokenOptions = ["cancelation_token", "cancelationToken"];
  const cancelSchema = {
    anyOf: cancelationTokenOptions.map((token) => ({
      type: "object",
      additionalProperties,
      properties: {
        action: { enum: ["cancel"] },
        [token]: allowAccessor({ type: "string", minLength: 1 }),
        if: allowAccessor({ type: "string" }),
        ref: allowAccessor({ type: "string" }),
      },
      required: ["action", token],
    })),
  };

  const fetchDataSchema = {
    type: "object",
    properties: {
      action: { enum: ["fetch-data"] },
      webhook: allowAccessor(webhookSchema),
      merge_strategy: allowAccessor({
        enum: ["replace", "overwrite", "soft-merge", "none"],
      }),
      idempotency_expiry: allowAccessor({ type: "string" }),
      idempotency_key: allowAccessor({ type: "string" }),
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
    },
    additionalProperties,
    required: ["action", "webhook", "merge_strategy"],
  };

  const updateProfileSchema = {
    type: "object",
    properties: {
      action: { enum: ["update-profile"] },
      merge: allowAccessor({
        enum: ["replace", "overwrite", "soft-merge", "none"],
      }),
      recipient_id: allowAccessor({ type: "string" }),
      profile: { type: "object" },
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
    },
    additionalProperties,
    required: ["action", "merge", "recipient_id", "profile"],
  };

  const profilePreferencesSchema = {
    type: "object",
    properties: {
      notification: { type: "object" },
      categories: { type: "object" },
    },
    additionalProperties,
    required: ["notification"],
  };

  const subscribeSchema = {
    type: "object",
    properties: {
      action: { enum: ["subscribe"] },
      list_id: allowAccessor({ type: "string", minLength: 1 }),
      recipient_id: allowAccessor({ type: "string", minLength: 1 }),
      subscription: allowAccessor({
        type: "object",
        properties: {
          preferences: allowAccessor(profilePreferencesSchema),
        },
        additionalProperties,
        required: ["preferences"],
      }),
      if: allowAccessor({ type: "string" }),
      ref: allowAccessor({ type: "string" }),
    },
    additionalProperties,
    required: ["action", "list_id", "recipient_id"],
  };

  const allStepsSchema = {
    type: "array",
    minItems: 1,
    items: {
      anyOf: [
        sendSchema,
        sendListSchema,
        delaySchema,
        invokeSchema,
        cancelSchema,
        fetchDataSchema,
        updateProfileSchema,
        subscribeSchema,
      ],
    },
  };

  return {
    send: ajv.compile(sendSchema),
    "send-list": ajv.compile(sendListSchema),
    delay: ajv.compile(delaySchema),
    invoke: ajv.compile(invokeSchema),
    cancel: ajv.compile(cancelSchema),
    "fetch-data": ajv.compile(fetchDataSchema),
    "update-profile": ajv.compile(updateProfileSchema),
    subscribe: ajv.compile(subscribeSchema),
    validateAllSteps: ajv.compile(allStepsSchema),
  };
};
