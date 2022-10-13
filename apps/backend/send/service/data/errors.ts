import makeError from "make-error";

export const ArgumentError = makeError("ArgumentError: ");

export class ArgumentRequiredError extends ArgumentError {
  constructor(message: string) {
    super(`${message}`);
  }
}
