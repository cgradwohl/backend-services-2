import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import africasTalking from "~/providers/africastalking-sms";
import sendHandler from "~/providers/africastalking-sms/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("africastalking");

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

describe("africas-talking provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an access key", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an originating number", async () => {
      const params = basicDeliveryParams({ apiKey: "sweetApiKey" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Africas Talking Application Username specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when provided an phone_number", () => {
      expect(
        africasTalking.handles({
          config: {} as any,
          profile: { phone_number: "+11234567890" },
        })
      ).toEqual(true);
    });

    it("should require phone number", () => {
      expect(
        africasTalking.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
