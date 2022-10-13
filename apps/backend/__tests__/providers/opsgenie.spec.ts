import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import opsgenie from "~/providers/opsgenie";
import sendHandler from "~/providers/opsgenie/send";
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
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe.only("opsgenie on call provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const templates = { plain: "details", message: "message" };
      await expect(
        sendHandler(basicDeliveryParams(), templates)
      ).rejects.toHaveProperty("message", "No API Key specified.");
    });

    it("should require message", async () => {
      const templates = {
        message: "",
        plain: "details",
      };
      await expect(
        sendHandler(
          basicDeliveryParams({
            apiKey: "c4bc3d44-767b-4e8f-999f-34d2beca2fc5",
          }),
          templates
        )
      ).rejects.toHaveProperty("message", "No message specified");
    });
  });

  describe("handles", () => {
    it("should return true", () => {
      expect(opsgenie.handles({ config: {} as any })).toEqual(true);
    });
  });
});
