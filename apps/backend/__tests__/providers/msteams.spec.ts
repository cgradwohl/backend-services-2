import axios from "axios";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import msteams from "~/providers/msteams";
import sendHandler from "~/providers/msteams/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

const axiosSpy = axios as any as jest.Mock;

const axiosPostSpy = jest.spyOn(axios, "post");

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

const expectedMsteamsResponse = { id: 123 };
const expectedAuthResponse = { data: { access_token: "abc" } };
const expectedAxiosResponse = { data: { id: 123 } };
const expectedConversationResponse = { data: { id: "conversation" } };

describe("ms teams provider", () => {
  describe("send", () => {
    beforeEach(() => {
      axiosPostSpy.mockResolvedValueOnce(expectedAuthResponse);
      axiosPostSpy.mockResolvedValue(expectedAxiosResponse);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should require an app id", async () => {
      const params = basicDeliveryParams({ appPassword: "123" });
      const templates = { msteams: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No App ID specified."
      );
    });

    it("should require an app password", async () => {
      const params = basicDeliveryParams({ appId: "123" });
      const templates = { msteams: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No App Password specified."
      );
    });

    it("should retrieve auth, make POST call to channel", async () => {
      const params = basicDeliveryParams(
        { appId: "123", appPassword: "123" },
        {
          profile: {
            ms_teams: { channel_id: "channel", service_url: "url" },
          },
        }
      );
      const templates = { msteams: "" };

      const response = await sendHandler(params, templates);

      // 1. Auth token, 2. POST call
      expect(axiosPostSpy.mock.calls.length).toBe(2);
      expect(response).toEqual(expectedMsteamsResponse);
    });

    it("should retrieve auth, get conversation_id, make POST call to user", async () => {
      axiosPostSpy.mockResolvedValueOnce(expectedConversationResponse);

      const params = basicDeliveryParams(
        { appId: "123", appPassword: "123" },
        {
          profile: {
            ms_teams: { user_id: "user", service_url: "url" },
          },
        }
      );
      const templates = { msteams: "" };

      const response = await sendHandler(params, templates);

      // 1. Auth token, 2. Get Conversation, 3. POST call
      expect(axiosPostSpy.mock.calls.length).toBe(3);
      expect(response).toEqual(expectedMsteamsResponse);
    });

    it("should retrieve auth, make POST call to user", async () => {
      const params = basicDeliveryParams(
        { appId: "123", appPassword: "123" },
        {
          profile: {
            ms_teams: {
              user_id: "user",
              conversation_id: "conversation",
              service_url: "url",
            },
          },
        }
      );
      const templates = { msteams: "" };

      const response = await sendHandler(params, templates);

      // 1. Auth token, 2. POST call
      expect(axiosPostSpy.mock.calls.length).toBe(2);
      expect(response).toEqual(expectedMsteamsResponse);
    });
  });

  describe("handles", () => {
    it("should return true when provided a user id within ms_teams", () => {
      expect(
        msteams.handles({
          config: {} as any,
          profile: {
            ms_teams: { user_id: "abcd-efgh-qwerty-wxyz", service_url: "url" },
          },
        })
      ).toEqual(true);
    });

    it("should require an id, one of: (conversation_id, channel_id, user_id)", () => {
      expect(
        msteams.handles({
          config: {} as any,
          profile: { service_url: "url" },
        })
      ).toEqual(false);
    });

    it("should require a service_url", () => {
      expect(
        msteams.handles({
          config: {} as any,
          profile: { ms_teams: { conversation_id: "x" } },
        })
      ).toEqual(false);
    });

    it("should be able to accept all of user_id, conversation_id, channel_id", () => {
      expect(
        msteams.handles({
          config: {} as any,
          profile: {
            ms_teams: {
              conversation_id: "x",
              channel_id: "y",
              user_id: "z",
              service_url: "url",
            },
          },
        })
      ).toEqual(true);
    });
  });
});
