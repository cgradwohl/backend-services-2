import HttpError from "./http-error";
import { INVALID_REQUEST_ERROR, VALIDATION_ERROR } from "./types";

interface IOptions {
  code?: HttpError["code"];
  type?: INVALID_REQUEST_ERROR | VALIDATION_ERROR;
}

export default class BadRequestError extends HttpError {
  constructor(message: string = "Bad Request", options?: IOptions) {
    super(message, {
      code: options?.code,
      statusCode: 400,
      type: options?.type ?? "invalid_request_error",
    });
    // this.docUrl = getDocUrl(code) ?? this.docUrl;
  }
}
