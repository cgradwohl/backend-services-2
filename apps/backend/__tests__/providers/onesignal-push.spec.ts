import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import onesignalPush from "~/providers/onesignal";
import sendHandler from "~/providers/onesignal/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios", () => {
  return {
    create: jest.fn(),
  };
});

const getDeliveryParams = (
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

describe("onesignal push provider", () => {
  describe("send", () => {
    let postStub;
    const profile = {
      oneSignalPlayerID: "mockOneSignalPlayerID",
    };

    const config = {
      apiKey: "mockApiKey",
      appId: "mockAppId",
    };

    const params = getDeliveryParams(config, {
      profile,
    });

    const template = {
      body: "push contents",
      title: "push title",
    };

    beforeEach(async () => {
      postStub = jest.fn();
      (axios.create as jest.Mock).mockReturnValue({
        post: postStub,
      });

      postStub.mockReturnValue(Promise.resolve({}));

      await sendHandler(params, template);
    });

    it("call with correct keys", () => {
      expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({
        baseURL: "https://onesignal.com/api/v1",
        headers: {
          Authorization: `Basic ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
        timeoutErrorMessage: "OneSignal Push API request timed out.",
      });
    });

    it("should apply email addresses", () => {
      expect(postStub.mock.calls[0]).toEqual([
        "/notifications",
        {
          app_id: config.appId,
          contents: { en: "push contents" },
          headings: { en: "push title" },
          include_player_ids: [profile.oneSignalPlayerID],
        },
      ]);
    });
  });

  describe("handles", () => {
    it("should return true when provided a oneSignalPlayerID", () => {
      expect(
        onesignalPush.handles({
          config: {} as any,
          profile: { oneSignalPlayerID: "123456" },
        })
      ).toEqual(true);
    });

    it("should require oneSignalPlayerID", () => {
      expect(
        onesignalPush.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });

    it("should check for stored tokens", () => {
      expect(
        onesignalPush.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {
            onesignal: [{ token: "123456" } as any],
          },
        })
      ).toEqual(true);
      expect(
        onesignalPush.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {},
        })
      ).toEqual(false);
    });
  });
});

describe("onesignal external id", () => {
  describe("send", () => {
    let postStub;
    const profile = {
      oneSignalExternalUserId: "mockOneSignalExternalId",
    };

    const config = {
      apiKey: "mockApiKey",
      appId: "mockAppId",
    };

    const params = getDeliveryParams(config, {
      profile,
    });

    params.override = {
      body: {
        include_email_tokens: ["mockEmail"],
      },
    };

    const template = {
      body: "push contents",
      title: "push title",
    };

    beforeEach(async () => {
      postStub = jest.fn();
      (axios.create as jest.Mock).mockReturnValue({
        post: postStub,
      });

      postStub.mockReturnValue(Promise.resolve({}));

      await sendHandler(params, template);
    });

    it("call with correct keys", () => {
      expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({
        baseURL: "https://onesignal.com/api/v1",
        headers: {
          Authorization: `Basic ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
        timeoutErrorMessage: "OneSignal Push API request timed out.",
      });
    });

    it("should apply email addresses", () => {
      expect(postStub.mock.calls[0]).toEqual([
        "/notifications",
        {
          app_id: config.appId,
          contents: { en: "push contents" },
          headings: { en: "push title" },
          include_external_user_ids: [profile.oneSignalExternalUserId],
          include_email_tokens: ["mockEmail"],
        },
      ]);
    });
  });

  describe("handles", () => {
    it("should return true when provided a oneSignalExternalId", () => {
      expect(
        onesignalPush.handles({
          config: {} as any,
          profile: { oneSignalExternalId: "123456" },
        })
      ).toEqual(true);
    });
  });
});
