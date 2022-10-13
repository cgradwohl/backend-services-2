import HttpError from "./http-error";

export default class ConflictError extends HttpError {
  constructor(message: string = "Conflict") {
    super(message, {
      statusCode: 409,
      type: "invalid_request_error",
    });
  }
}
