import Ajv from "ajv";
import ajvErrors from "ajv-errors";
import ajvFormats from "ajv-formats";
import { BadRequest } from "~/lib/http-errors";

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);
ajvFormats(ajv);

export function buildAjvValidator<T>(schema: any) {
  const validate = ajv.compile(schema);

  const throwBadRequestOnInvalidBody = (body: unknown): asserts body is T => {
    const valid = validate(body);

    if (!valid) {
      const [{ message }] = validate.errors;
      throw new BadRequest(message);
    }
  };

  return throwBadRequestOnInvalidBody;
}

/**
 * Validators build with the buildValidator function must be annotated with this type
 * due to a weird typescript quirk. Otherwise you'll get a TS(2775) error.
 *
 * Example:
 * validatePatchTokenBody: Validator<IUsersPatchTokenData> = buildValidator({});
 */
export type Validator<T> = (body: unknown) => asserts body is T;
