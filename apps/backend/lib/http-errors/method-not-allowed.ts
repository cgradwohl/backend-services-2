import HttpError from "./http-error";

export default class MethodNotAllowedError extends HttpError {
  constructor(message: string = "Method Not Allowed") {
    super(message, {
      statusCode: 405,
      type: "invalid_request_error",
    });
  }
}
