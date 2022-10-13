import { InternalCourierError } from "~/lib/errors";
import * as GetWebhookHeaderModule from "../get-webhook-header";

const getWebhookHeader = GetWebhookHeaderModule.getWebhookHeader;

describe("getWebhookHeader", () => {
  it("should return a signed header", () => {
    const body = JSON.stringify({
      data: { foo: "bar" },
      type: "message:updated",
    });

    const secret = "secret-time";

    const result = getWebhookHeader({ body, secret });

    expect(result).toBeDefined();
    expect(result["courier-signature"]).toBeDefined();
  });

  it("should return undefined", () => {
    const body = JSON.stringify({
      data: { foo: "bar" },
      type: "message:updated",
    });

    const secret = undefined;
    const result = getWebhookHeader({ body, secret });

    expect(result).toBeUndefined();
  });

  it("should throw an InternalCourierError", () => {
    const spy = jest
      .spyOn(GetWebhookHeaderModule, "computeSignature")
      .mockImplementation(() => {
        throw new Error();
      });

    const body = JSON.stringify({
      data: { foo: "bar" },
      type: "message:updated",
    });

    const secret = "secret-time";

    expect(() => getWebhookHeader({ body, secret })).toThrowError();
    expect(() => getWebhookHeader({ body, secret })).toThrow(
      InternalCourierError
    );
    spy.mockRestore();
  });
});
