import { BadRequest } from "~/lib/http-errors";
import { validatePutTokenBody } from "../put-token-body";

describe("validate put token body", () => {
  it("should not throw given valid put", () => {
    expect(() => validatePutTokenBody({ provider_key: "apn" })).not.toThrow();
    expect(() =>
      validatePutTokenBody({
        provider_key: "apn",
        token: "afasd",
        properties: { any_value_allowed: true },
        device: {
          app_id: "app_id",
        },
      })
    ).not.toThrow();
  });

  it("should throw given invalid patch", () => {
    expect(() => validatePutTokenBody({})).toThrow(BadRequest);
    expect(() =>
      validatePutTokenBody({ provider_key: "apn", status: "blues" })
    ).toThrow(BadRequest);
    expect(() =>
      validatePutTokenBody({ provider_key: "apn", im_not_a_field: "" })
    ).toThrow(BadRequest);
  });
});
