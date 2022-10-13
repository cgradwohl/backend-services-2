import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import pushbullet from "~/providers/pushbullet";
import sendHandler from "~/providers/pushbullet/send";
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

describe.only("pushbullet provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an access token", async () => {
      const templates = { title: "title", plain: "body" };
      await expect(
        sendHandler(basicDeliveryParams(), templates)
      ).rejects.toHaveProperty("message", "No Access Token specified.");
    });

    it("should require plain", async () => {
      const templates = {
        title: "title",
        plain: "",
      };
      await expect(
        sendHandler(
          basicDeliveryParams({
            accessToken: "myAccessToken",
          }),
          templates
        )
      ).rejects.toHaveProperty("message", "No body specified");
    });
  });

  describe("handles", () => {
    it("should return true", () => {
      expect(pushbullet.handles({ config: {} as any })).toEqual(true);
    });
  });
});
