import HttpError from "./http-error";

interface IOptions {
  headers?: HttpError["headers"];
}

export default class TooManyRequestsError extends HttpError {
  constructor(message: string = "Too Many Requests", options?: IOptions) {
    super(message, {
      headers: options?.headers,
      statusCode: 429,
      type: "rate_limit_error",
    });
  }
}
