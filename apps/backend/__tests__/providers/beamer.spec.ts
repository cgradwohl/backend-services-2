import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import beamer from "~/providers/beamer";
import sendHandler from "~/providers/beamer/send";
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

describe.only("beamer provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "", title: "", category: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require a category", async () => {
      const params = basicDeliveryParams({ apiKey: "a-key", title: "" });
      const templates = { plain: "", title: "A title", category: undefined };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No category provided."
      );
    });

    it("should require a title", async () => {
      const params = basicDeliveryParams({ apiKey: "a-key" });
      const templates = { plain: "", title: undefined, category: "A category" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No title provided."
      );
    });
  });

  describe("handles", () => {
    it("should return true when provided category and title", () => {
      expect(
        beamer.handles({
          config: {} as any,
          profile: {
            beamer: { title: "A title", category: "A category" },
          },
        })
      ).toEqual(true);
    });

    it("should return true regardless", () => {
      expect(
        beamer.handles({
          config: {} as any,
          profile: { beamer: {} },
        })
      ).toEqual(true);
    });
  });
});
