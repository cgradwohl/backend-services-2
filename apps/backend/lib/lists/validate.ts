import ajv from "~/lib/ajv";

import { schema as preferencesSchema } from "lib/preferences/validate";

const {
  definitions: preferencesDefintitions,
  ...preferences
} = preferencesSchema;

export const schema = {
  additionalProperties: false,
  definitions: {
    ...preferencesDefintitions,
  },
  properties: {
    name: { type: "string" },
    preferences,
  },
  type: "object",
};

export default ajv.compile(schema);
