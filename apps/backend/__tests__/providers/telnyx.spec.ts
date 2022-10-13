import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import telnyx from "~/providers/telnyx";
import sendHandler from "~/providers/telnyx/send";
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

describe("telnyx provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an apiKey", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an originating number", async () => {
      const params = basicDeliveryParams({ apiKey: "api-key-value" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Originating Number specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when provided an phone_number", () => {
      expect(
        telnyx.handles({
          config: {} as any,
          profile: { phone_number: "+11234567890" },
        })
      ).toEqual(true);
    });

    it("should require phone number", () => {
      expect(
        telnyx.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
