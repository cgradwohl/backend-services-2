import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import intercom from "~/providers/intercom";
import sendHandler from "~/providers/intercom/send";
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

describe("intercom provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an access token", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Access Token specified."
      );
    });

    it("should require a from user", async () => {
      const params = basicDeliveryParams({ accessToken: "1a2b" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No From User ID specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when provided to", () => {
      expect(
        intercom.handles({
          config: {} as any,
          profile: {
            intercom: { to: { id: "to" } },
          },
        })
      ).toEqual(true);
    });

    it("should require to", () => {
      expect(
        intercom.handles({
          config: {} as any,
          profile: { intercom: {} },
        })
      ).toEqual(false);
    });
  });
});
