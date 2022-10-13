import HttpError from "./http-error";

export default class PaymentRequiredError extends HttpError {
  constructor(message: string = "Payment Required") {
    super(message, {
      statusCode: 402,
      type: "authorization_error",
    });
  }
}
