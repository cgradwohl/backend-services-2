import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import airship from "~/providers/airship";
import sendHandler from "~/providers/airship/send";
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

describe("airship provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require a base url", async () => {
      const params = basicDeliveryParams();
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Base URL specified."
      );
    });

    it("should require an auth token", async () => {
      const params = basicDeliveryParams({ baseUrl: "https://airship.co/" });
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Auth Token specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when provided an audience within airship", () => {
      expect(
        airship.handles({
          config: {} as any,
          profile: { airship: { audience: { alias: "abc-123" } } },
        })
      ).toEqual(true);
    });

    it("should require an audience", () => {
      expect(
        airship.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
