import axios, { AxiosError, AxiosRequestConfig } from "axios";
import makeError from "make-error";

export const CheckDeliveryStatusError = makeError("CheckDeliveryStatusError");
export const ProviderConfigurationError = makeError(
  "ProviderConfigurationError"
);

interface DescriptiveAxiosErrorConfig<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  message: string;
}

class DescriptiveAxiosError<T = any> extends Error {
  public data: T;
  public status: number;
  public statusText: string;
  public headers: any;
  public config: AxiosRequestConfig;
  public message: string;

  constructor(errorData: DescriptiveAxiosErrorConfig) {
    super("DescriptiveAxiosError");
    // see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    ({
      data: this.data,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      config: this.config,
      message: this.message,
    } = errorData);

    // Remove timeoutErrorMessage because of confusion with actual error message
    if (this.config?.timeoutErrorMessage) {
      this.config.timeoutErrorMessage = undefined;
    }
  }
}
export class ProviderResponseError extends Error {
  public payload?: any;
  private error: Error;
  public request?: any;

  // via: https://blog.joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
  constructor(
    error: AxiosError | Error | string,
    payload?: any,
    request?: any
  ) {
    if (typeof error === "string") {
      error = new Error(error);
    }

    super("ProviderResponseError");
    // see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = this.constructor.name; // stack traces display correctly now
    // Error.captureStackTrace(this, ProviderResponseError);

    if (axios.isAxiosError(error) && error.response) {
      const { request, ...rest } = error.response;
      this.error = new DescriptiveAxiosError({
        ...rest,
        message: error.message,
      });
    } else {
      this.error = error;
    }

    // optional error payload
    if (payload) {
      this.payload = payload;
    }

    if (request) {
      this.request = request;
    }
  }

  public toString() {
    return this.error.toString();
  }
}

export const RetryableProviderResponseError = makeError(
  "RetryableProviderResponseError",
  ProviderResponseError
);

export const handleSendError = (err: Error) => {
  if (!axios.isAxiosError(err)) {
    throw new ProviderResponseError(err);
  }

  const status = err.response?.status;

  if (
    // 403: Forbidden
    // 408: Timeout
    // 429: Too many requests
    // 5xx: Server Error
    [403, 408, 429].includes(status) ||
    err.code === "ECONNABORTED" ||
    status >= 500
  ) {
    throw new RetryableProviderResponseError(err);
  }

  throw new ProviderResponseError(err);
};
