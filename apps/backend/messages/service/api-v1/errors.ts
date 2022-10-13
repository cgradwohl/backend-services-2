import makeError from "make-error";

export const MessageNotFoundError = makeError("MessageNotFoundError");
export const DuplicateMessageIdError = makeError("DuplicateMessageIdError");
export const MissingEventFieldsError = makeError("MissingEventFieldsError");
