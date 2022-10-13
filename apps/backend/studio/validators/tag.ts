import { createSchemaValidator } from "../../lib/create-schema-validator";
import { ITag } from "../../types.api";

export const tagsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    color: { type: "string" },
    label: { type: "string" },
    created: { type: "number" },
    creator: { type: "string" },
  },
  required: ["color", "label"],
};
const tagValidator = createSchemaValidator<ITag>(tagsSchema);
export default tagValidator;
