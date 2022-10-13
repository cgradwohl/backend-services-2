import { IUsersPatchTokenData } from "~/types.public";
import { buildAjvValidator, Validator } from "~/lib/build-ajv-validator";

export const validatePatchTokenBody: Validator<IUsersPatchTokenData> =
  buildAjvValidator({
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
      patch: {
        items: {
          properties: {
            op: {
              enum: ["add", "remove", "replace", "test"],
              type: "string",
            },
            path: {
              type: "string",
            },
            value: {
              anyOf: [
                {
                  additionalProperties: {},
                  type: "object",
                },
                {
                  type: "string",
                },
              ],
            },
          },
          required: ["op"],
          additionalProperties: false,
          type: "object",
        },
        type: "array",
      },
    },
    required: ["patch"],
    additionalProperties: false,
    type: "object",
  });
