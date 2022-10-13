import HttpError from "./http-error";

export default class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(message, {
      statusCode: 401,
      type: "authentication_error",
    });
  }
}
