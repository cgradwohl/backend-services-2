import makeError from "make-error";

export const UnexpectedEventTypeError = makeError("UnexpectedEventTypeError");
export const UnexpectedEventSourceError = makeError(
  "UnexpectedEventSourceError"
);
export const BadCursor = makeError("BadCursor");
