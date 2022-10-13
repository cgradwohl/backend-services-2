import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import splunkOnCall from "~/providers/splunk-on-call";
import sendHandler from "~/providers/splunk-on-call/send";
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

describe.only("splunk on call provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams({
        apiId: "a-id",
        userName: "userName",
        profile: {
          splunk_on_call: { target: { type: "t-type", slug: "t-slug" } },
        },
      });
      const templates = { plain: "details", summary: "summary" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an api id", async () => {
      const params = basicDeliveryParams({
        apiKey: "a-key",
        userName: "userName",
        profile: {
          splunk_on_call: { target: { type: "t-type", slug: "t-slug" } },
        },
      });
      const templates = { plain: "details", summary: "summary" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Id specified."
      );
    });

    it("should require a username", async () => {
      const params = basicDeliveryParams({
        apiKey: "a-key",
        apiId: "a-id",
        profile: {
          splunk_on_call: { target: { type: "t-type", slug: "t-slug" } },
        },
      });
      const templates = { plain: "details", summary: "summary" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No username specified."
      );
    });

    it("should require a summary", async () => {
      const params = basicDeliveryParams({
        apiKey: "a-key",
        apiId: "a-id",
        userName: "userName",
        profile: {
          splunk_on_call: { target: { type: "t-type", slug: "t-slug" } },
        },
      });
      const templates = { plain: "details", summary: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No summary specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when splunk_on_call attribute is correctly passed", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: { target: { type: "t-type", slug: "t-slug" } },
          },
        })
      ).toEqual(true);
    });
    it("should return false when splunk_on_call is not passed", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
    it("should return false when splunk_on_call is not an object", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: "string",
          },
        })
      ).toEqual(false);
    });
    it("should return false when target in splunk_on_call attribute is not passed", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: {},
          },
        })
      ).toEqual(false);
    });
    it("should return false when type in target in splunk_on_call attribute is not passed", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: { target: { slug: "t-slug" } },
          },
        })
      ).toEqual(false);
    });
    it("should return false when slug in target in splunk_on_call attribute is not passed", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: { target: { type: "t-type" } },
          },
        })
      ).toEqual(false);
    });
    it("should return false when type in target in splunk_on_call attribute is empty", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: { target: { type: "", slug: "t-slug" } },
          },
        })
      ).toEqual(false);
    });
    it("should return false when slug in target in splunk_on_call attribute is empty", () => {
      expect(
        splunkOnCall.handles({
          config: {} as any,
          profile: {
            splunk_on_call: { target: { type: "t-type", slug: "" } },
          },
        })
      ).toEqual(false);
    });
  });
});
