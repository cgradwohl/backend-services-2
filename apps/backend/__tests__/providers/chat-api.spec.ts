import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import chatApi from "~/providers/chat-api";
import sendHandler from "~/providers/chat-api/send";
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

describe.only("Chat API provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require instance id", async () => {
      const params = basicDeliveryParams({
        token: "token",
        profile: {
          chat_api: { chat_id: "someId" },
        },
      });
      const templates = {
        plain: "details",
        quotedMsgId: "",
        mentionedPhones: "",
      };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Instance Id specified."
      );
    });

    it("should require a token", async () => {
      const params = basicDeliveryParams({
        instanceId: "instanceId",
        profile: {
          chat_api: { chat_id: "someId" },
        },
      });
      const templates = {
        plain: "details",
        quotedMsgId: "",
        mentionedPhones: "",
      };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Token specified."
      );
    });
  });

  describe("handles", () => {
    it("should return true when chat_api attribute is correctly passed", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: { phone_number: "2398489" },
          },
        })
      ).toEqual(true);
    });
    it("should return false when chat_api attribute is not passed", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
    it("should return false when chat_api is not an object", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: "string",
          },
        })
      ).toEqual(false);
    });
    it("should return false when neither phone_number or chat_id is passed in chat_api attribute", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chatApi: {},
          },
        })
      ).toEqual(false);
    });
    it("should return false when phone_number is passed in chat_api attribute, but empty", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: { phone_number: "" },
          },
        })
      ).toEqual(false);
    });
    it("should return false when chat_id is passed in chat_api attribute, but empty", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: { chat_id: "" },
          },
        })
      ).toEqual(false);
    });
    it("should return true when phone_number passed in chat_api attribute", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: { phone_number: "phone number" },
          },
        })
      ).toEqual(true);
    });
    it("should return true when chat_id is passed in chat_api attribute", () => {
      expect(
        chatApi.handles({
          config: {} as any,
          profile: {
            chat_api: { chat_id: "chat id" },
          },
        })
      ).toEqual(true);
    });
  });
});
