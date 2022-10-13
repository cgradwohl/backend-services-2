import { buildAjvValidator } from "~/lib/build-ajv-validator";
import { MessageBrand } from "../types";
import { MessageBrandSchema } from "./brand.schema";

const validate = buildAjvValidator({
  $schema: "http://json-schema.org/draft-07/schema#",
  ...MessageBrandSchema,
});

export const validateMessageBrand = (brand?: MessageBrand) => {
  if (!brand) {
    return;
  }

  return validate(brand);
};
