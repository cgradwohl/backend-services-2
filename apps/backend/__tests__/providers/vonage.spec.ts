import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import vonage from "~/providers/vonage";
import sendHandler from "~/providers/vonage/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

const basicDeliveryParams = (
  config?: any,
  body: any = { profile: {} }
): DeliveryHandlerParams => {
  const variableData = {
    event: "",
    recipient: "",
    ...body,
  };
  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...config,
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe.only("vonage provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams({
        apiSecret: "a-secret",
        fromNumber: "1234567890",
        profile: {
          phone_number: "0987654321",
        },
      });
      const templates = { plain: "details" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an api secret", async () => {
      const params = basicDeliveryParams({
        apiKey: "a-key",
        fromNumber: "1234567890",
        profile: {
          phone_number: "0987654321",
        },
      });
      const templates = { plain: "details" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Secret specified."
      );
    });

    it("should require a from number", async () => {
      const params = basicDeliveryParams({
        apiSecret: "a-secret",
        apiKey: "a-key",
        profile: {
          phone_number: "0987654321",
        },
      });
      const templates = { plain: "details" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No From Number specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when phone_number attribute is correctly passed", () => {
      expect(
        vonage.handles({
          config: {} as any,
          profile: {
            phone_number: "0987654321",
          },
        })
      ).toEqual(true);
    });
    it("should return false when phone_number is not passed", () => {
      expect(
        vonage.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
