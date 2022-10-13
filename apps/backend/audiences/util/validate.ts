import ajv from "~/lib/ajv";

const audiencesSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    Filter: {
      oneOf: [
        {
          $ref: "#/definitions/SingleFilterConfig",
        },
        {
          $ref: "#/definitions/NestedFilterConfig",
        },
      ],
    },
    NestedFilterConfig: {
      additionalProperties: false,
      properties: {
        operator: {
          $ref: "#/definitions/Operator",
        },
        filters: {
          items: {
            $ref: "#/definitions/Filter",
          },
          type: "array",
        },
      },
      type: "object",
    },
    Operator: {
      enum: [
        "AND",
        "ENDS_WITH",
        "EQ",
        "EXISTS",
        "GT",
        "GTE",
        "INCLUDES",
        "IS_AFTER",
        "IS_BEFORE",
        "LT",
        "LTE",
        "NEQ",
        "OMIT",
        "OR",
        "STARTS_WITH",
      ],
      type: "string",
    },
    SingleFilterConfig: {
      additionalProperties: false,
      properties: {
        operator: {
          $ref: "#/definitions/Operator",
        },
        path: {
          type: "string",
        },
        value: {
          type: "string",
        },
      },
      type: "object",
    },
  },
  properties: {
    description: {
      type: "string",
    },
    name: {
      type: "string",
    },
    filter: {
      $ref: "#/definitions/Filter",
    },
  },
  required: ["filter"],
  type: "object",
};
export default ajv.compile(audiencesSchema);
