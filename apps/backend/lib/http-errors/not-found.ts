import HttpError from "./http-error";

export default class NotFoundError extends HttpError {
  constructor(message: string = "Not Found") {
    super(message, {
      statusCode: 404,
      type: "invalid_request_error",
    });
  }
}
