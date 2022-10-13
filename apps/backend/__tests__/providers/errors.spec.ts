import { AxiosError } from "axios";

import {
  handleSendError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";

const createError = (status: number, statusText: string) => {
  const err = new Error() as AxiosError;
  err.response = {
    config: {},
    data: {},
    headers: {},
    status,
    statusText,
  };
  err.isAxiosError = true;

  return err;
};

describe("RetryableProviderResponseError", () => {
  it("should also be an instanceof ProviderResponseError", () => {
    expect(new RetryableProviderResponseError("error")).toBeInstanceOf(
      ProviderResponseError
    );
  });
});

describe("when handling Axios Send errors", () => {
  it("will throw a ProviderResponseError if err is not AxiosError", () =>
    expect(() => handleSendError(new Error())).toThrow(ProviderResponseError));

  it("will throw a RetryableProviderResponseError if status is 403", () =>
    expect(() => handleSendError(createError(403, "Forbidden"))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw a RetryableProviderResponseError if status is 408", () =>
    expect(() => handleSendError(createError(408, "Timeout"))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw a RetryableProviderResponseError if status is 429", () =>
    expect(() => handleSendError(createError(429, "Limit Exceeded"))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw a RetryableProviderResponseError if status is 5xx", () =>
    expect(() =>
      handleSendError(createError(500, "Internal Server Error"))
    ).toThrow(RetryableProviderResponseError));

  const statuses = [400, 401, 402, 404];
  statuses.forEach((status) => {
    it(`will not retry ${status} errors`, async () =>
      expect(() => handleSendError(createError(status, ""))).toThrow(
        ProviderResponseError
      ));
  });

  it("will throw a ProviderResponseError if response is missing", () => {
    const err = createError(0, "");
    delete err.response;

    expect(() => handleSendError(err)).toThrow(ProviderResponseError);
  });
});
