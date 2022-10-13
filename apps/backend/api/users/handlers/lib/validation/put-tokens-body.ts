import { IUsersPutTokensData } from "~/types.public";
import { buildAjvValidator, Validator } from "~/lib/build-ajv-validator";

export const validatePutTokensBody: Validator<IUsersPutTokensData> =
  buildAjvValidator({
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
      tokens: {
        items: {
          properties: {
            device: {
              properties: {
                ad_id: {
                  type: "string",
                },
                app_id: {
                  type: "string",
                },
                device_id: {
                  type: "string",
                },
                manufacturer: {
                  type: "string",
                },
                model: {
                  type: "string",
                },
                platform: {
                  type: "string",
                },
              },
              additionalProperties: false,
              type: "object",
            },
            properties: {
              additionalProperties: {},
              type: "object",
            },
            provider_key: {
              type: "string",
            },
            expiry_date: {
              type: ["string", "boolean"],
            },
            status: {
              enum: ["active", "failed", "revoked", "unknown"],
              type: "string",
            },
            status_reason: {
              type: "string",
            },
            token: {
              type: "string",
            },
            tracking: {
              properties: {
                ip: {
                  type: "string",
                },
                lat: {
                  type: "string",
                },
                long: {
                  type: "string",
                },
                os_version: {
                  type: "string",
                },
              },
              additionalProperties: false,
              type: "object",
            },
          },
          required: ["provider_key", "token"],
          additionalProperties: false,
          type: "object",
        },
        type: "array",
      },
    },
    required: ["tokens"],
    additionalProperties: false,
    type: "object",
  });
