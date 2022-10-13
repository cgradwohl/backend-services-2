import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import streamChat from "~/providers/stream-chat";
import sendHandler from "~/providers/stream-chat/send";
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

describe("handles", () => {
  it("should return true", () => {
    expect(streamChat.handles({ config: {} as any })).toEqual(true);
  });
});

describe("stream-chat provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an api secret", async () => {
      const params = basicDeliveryParams({ apiKey: "adfasdqsd" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Secret specified."
      );
    });

    it("should require a sender ID", async () => {
      const params = basicDeliveryParams({
        apiKey: "adfasdqsd",
        apiSecret: "jkbasdbad",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Sender ID specified."
      );
    });

    it("should require either messageId or channelId and channelType", async () => {
      const params = basicDeliveryParams({
        apiKey: "adfasdqsd",
        apiSecret: "ksjbnkjasnd",
        senderId: "landlajdns",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Either messageId or channelId and channelType required"
      );
    });

    it("should respect the params", async () => {
      const response = {
        data: {
          message: {
            id: "message-id",
            user: {
              id: "Argo",
            },
          },
        },
      };
      (axios as any).mockResolvedValue(response);

      const params = basicDeliveryParams(
        {
          apiKey: "ArgoLovesToHoldTheKeys",
          apiSecret: "ArgoHatesToKeepTheSecret",
          senderId: "Argo",
        },
        {
          profile: {
            streamChat: {
              channelId: "aslkdjnans",
              channelType: "alksj",
            },
          },
        }
      );
      const templates = { plain: "Hello from Argo!" };

      await expect(sendHandler(params, templates)).resolves.toHaveProperty(
        "data",
        {
          message: {
            id: "message-id",
            user: {
              id: "Argo",
            },
          },
        }
      );
    });
  });
});
