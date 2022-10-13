import HttpError from "./http-error";

export default class InternalServerError extends HttpError {
  constructor(message: string = "Internal Server Error") {
    super(message, {
      statusCode: 500,
      type: "api_error",
    });
  }
}
