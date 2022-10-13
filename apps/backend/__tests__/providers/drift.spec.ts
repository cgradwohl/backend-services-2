import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import drift from "~/providers/drift";
import sendHandler from "~/providers/drift/send";
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

describe("drift provider", () => {
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
  });

  describe("handles", () => {
    it("should return true when provided email", () => {
      expect(
        drift.handles({
          config: {} as any,
          profile: { email: "example@example.com" },
        })
      ).toEqual(true);
    });

    it("should require email", () => {
      expect(
        drift.handles({
          config: {} as any,
          profile: { drift: {} },
        })
      ).toEqual(false);
    });
  });
});
