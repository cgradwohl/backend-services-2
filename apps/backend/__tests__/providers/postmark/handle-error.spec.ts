import { ProviderResponseError } from "./../../../providers/errors";
import { AxiosError } from "axios";
import { RetryableProviderResponseError } from "~/providers/errors";
import { handleError } from "~/providers/postmark/send";

jest.mock("~/lib/get-environment-variable");

describe("when handling error", () => {
  it("will throw RetryableProviderResponseError if err is UnknownError and statusCode is 429", () => {
    const internalPostmarkServerError: AxiosError = new Error("") as AxiosError;
    internalPostmarkServerError.response = {
      status: 429,
      statusText: "",
      data: null,
      headers: [],
      config: {},
    };

    expect(() => handleError(internalPostmarkServerError)).toThrow(
      RetryableProviderResponseError
    );
  });
  it("will throw RetryableProviderResponseError if err is InternalServerError", () => {
    const internalPostmarkServerError: AxiosError = new Error("") as AxiosError;
    internalPostmarkServerError.response = {
      status: 500,
      statusText: "",
      data: null,
      headers: [],
      config: {},
    };

    expect(() => handleError(internalPostmarkServerError)).toThrow(
      RetryableProviderResponseError
    );
  });

  it("will throw RetryableProviderResponseError if err is ServiceUnavailableError", () => {
    const internalPostmarkServerError: AxiosError = new Error("") as AxiosError;
    internalPostmarkServerError.response = {
      status: 503,
      statusText: "",
      data: null,
      headers: [],
      config: {},
    };

    expect(() => handleError(internalPostmarkServerError)).toThrow(
      RetryableProviderResponseError
    );
  });

  it("will throw ProviderResponseError if err not retryable", () => {
    const internalPostmarkServerError: AxiosError = new Error("") as AxiosError;
    internalPostmarkServerError.response = {
      status: 422,
      statusText: "",
      data: null,
      headers: [],
      config: {},
    };

    expect(() => handleError(internalPostmarkServerError)).toThrow(
      ProviderResponseError
    );
  });
});
