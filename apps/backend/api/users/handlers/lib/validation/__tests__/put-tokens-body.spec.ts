import { BadRequest } from "~/lib/http-errors";
import { validatePutTokensBody } from "../put-tokens-body";

describe("validate put tokens body", () => {
  it("should not throw given valid put", () => {
    expect(() =>
      validatePutTokensBody({
        tokens: [{ token: "asf", provider_key: "apn" }],
      })
    ).not.toThrow();

    expect(() =>
      validatePutTokensBody({
        tokens: [
          {
            provider_key: "apn",
            token: "afasd",
            properties: { any_value_allowed: true },
            device: {
              app_id: "app_id",
            },
          },
        ],
      })
    ).not.toThrow();
  });

  it("should throw given invalid patch", () => {
    expect(() => validatePutTokensBody({})).toThrow(BadRequest);
    expect(() => validatePutTokensBody({ foo: "bar" })).toThrow(BadRequest);
    expect(() =>
      validatePutTokensBody({
        tokens: [{ provider_key: "apn", status: "blues" }],
      })
    ).toThrow(BadRequest);
    expect(() =>
      validatePutTokensBody({ provider_key: "apn", im_not_a_field: "" })
    ).toThrow(BadRequest);
  });
});
