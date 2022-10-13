import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import nowpush from "~/providers/nowpush";
import sendHandler from "~/providers/nowpush/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

const deliveryParams = (
  config?: any,
  override?: any
): DeliveryHandlerParams => {
  const variableData = {
    event: "My_Now_Push",
    profile: {},
    recipient: "",
  };
  const variableHandler = createVariableHandler({
    value: variableData,
  }).getScoped("data");
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...config,
      provider: "",
    },
    linkHandler,
    override,
    profile: variableData.profile,
    variableData,
    variableHandler,
  };
};

describe("NowPush provider", () => {
  describe("handles", () => {
    it("should return true", () => {
      expect(
        nowpush.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(true);
    });
  });

  describe("send", () => {
    afterEach(jest.clearAllMocks);

    it("should require a apiKey", async () => {
      const params = deliveryParams();
      const templates = { plain: "Hello World" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API key provided"
      );
    });

    it("should use config.apiKey", async () => {
      const params = deliveryParams({
        apiKey: "APIKEY_IN_CONFIG",
      });
      const templates = { plain: "Hello World" };

      (axios as any as jest.Mock).mockResolvedValue({
        msg: "Message Send",
        data: {
          _id: "620fe475fe30e200181d3243",
          msg_at: "2022-02-18T18:24:53.695Z",
          chat_room: "986222",
          device_type: "api",
          message_type: "nowpush_note",
          message: "Hello World",
          note: "Hello World",
          is_encrypted: false,
        },
        isError: false,
      });

      await expect(sendHandler(params, templates)).resolves.toHaveProperty(
        "message",
        "Hello World"
      );
    });

    it("should use profile.apiKey", async () => {
      let params = deliveryParams();
      const templates = { plain: "Hello World" };

      params.profile = {
        nowpush: {
          apiKey: "APIKEY_IN_PROFILE",
        },
      };

      (axios as any as jest.Mock).mockResolvedValue({
        msg: "Message Send",
        data: {
          _id: "620fe475fe30e200181d3243",
          msg_at: "2022-02-18T18:24:53.695Z",
          chat_room: "986222",
          device_type: "api",
          message_type: "nowpush_note",
          message: "Hello World",
          note: "Hello World",
          is_encrypted: false,
        },
        isError: false,
      });

      await expect(sendHandler(params, templates)).resolves.toHaveProperty(
        "message",
        "Hello World"
      );
    });

    it("should use profile", async () => {
      let params = deliveryParams();
      const templates = { plain: "Hello World" };

      params.profile = {
        nowpush: {
          apiKey: "APIKEY_IN_PROFILE",
          device_type: "browser",
          message_type: "nowpush_link",
          url: "test.com",
        },
      };

      (axios as any as jest.Mock).mockResolvedValue({
        msg: "Message Send",
        data: {
          _id: "6217d77dedb4ba0018c3b51a",
          msg_at: "2022-02-24T19:07:41.667Z",
          chat_room: "986222",
          url: "www.courier.com",
          device_type: "browser",
          message_type: "nowpush_link",
          message: "Hello World",
          note: "Hello World",
          is_encrypted: false,
        },
        isError: false,
      });

      await expect(sendHandler(params, templates)).resolves.toHaveProperty(
        "message",
        "Hello World"
      );
    });
  });
});
