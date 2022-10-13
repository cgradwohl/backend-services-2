import HttpError from "./http-error";

export default class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden") {
    super(message, {
      statusCode: 403,
      type: "authorization_error",
    });
  }
}
