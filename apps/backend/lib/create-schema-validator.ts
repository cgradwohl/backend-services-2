import ajv, { extractErrors } from "~/lib/ajv";
import { BadRequest } from "~/lib/http-errors";

export const createSchemaValidator = <T>(schema: any) => {
  const validator = ajv.compile(schema);

  // TODO: change to assert function when we upgrade to TS 3.7
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
  const validate = (data: T) => {
    const valid = validator(data);

    if (!valid) {
      const errors = extractErrors(schema, data, validator.errors);
      throw new BadRequest(JSON.stringify(errors));
    }
  };

  return validate;
};
