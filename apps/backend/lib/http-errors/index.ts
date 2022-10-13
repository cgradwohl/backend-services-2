import BadRequest from "./bad-request";
import Conflict from "./conflict";
import Forbidden from "./forbidden";
import HttpError from "./http-error";
import InternalServerError from "./internal-server-error";
import MethodNotAllowed from "./method-not-allowed";
import NotFound from "./not-found";
import PaymentRequired from "./payment-required";
import TooManyRequests from "./too-many-requests";
import Unauthorized from "./unauthorized";

export {
  BadRequest,
  Unauthorized,
  PaymentRequired,
  Forbidden,
  HttpError,
  NotFound,
  MethodNotAllowed,
  Conflict,
  TooManyRequests,
  InternalServerError,
};

export const Codes = {
  400: BadRequest,
  401: Unauthorized,
  402: PaymentRequired,
  403: Forbidden,
  404: NotFound,
  405: MethodNotAllowed,
  409: Conflict,
  429: TooManyRequests,
  500: InternalServerError,
};
