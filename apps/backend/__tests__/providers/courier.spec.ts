import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import courierPush from "~/providers/courier";
import sendHandler, {
  CourierDeliveryHandlerParams,
} from "~/providers/courier/send";
import { DeliveryHandlerParams } from "~/providers/types";
import getTenantAuthTokens from "~/lib/tenant-service/list-api-keys";
import axios from "axios";
import {
  ApiSendRequestCourierOverrideInstance,
  ApiSendRequestOverrideChannel,
} from "~/types.public";

jest.mock("axios");
jest.mock("~/lib/tenant-service/list-api-keys");

const getTenantAuthTokensMock = getTenantAuthTokens as jest.Mock;
const axiosMock = axios as jest.Mocked<typeof axios>;

const basicDeliveryParams = (
  config?: any,
  body: any = { profile: {} }
): CourierDeliveryHandlerParams => {
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
    tenantId: "mockTenantId",
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

const params = basicDeliveryParams(
  {},
  {
    profile: {
      courier: { channel: "MOCK_CHANNEL" },
    },
  }
);

const templates = {
  title: "mock title",
  body: "mock body",
};

describe.only("Courier Push Provider", () => {
  describe("send", () => {
    beforeAll(() => {
      process.env.IN_APP_API_URL = "https://push.courier.com";
    });

    afterEach(jest.resetAllMocks);

    it("banner is not implemented", async () => {
      expect(
        await sendHandler(
          {
            channel: {
              blockIds: [],
              id: "mockChannel",
              taxonomy: "banner:courier",
              providers: [],
            },
            ...params,
          },
          templates
        )
      ).toEqual({
        status: "not implemented",
      });
    });

    it("will fail without apikey", async () => {
      getTenantAuthTokensMock.mockImplementation(() => Promise.resolve([]));
      const templates = {};

      try {
        await sendHandler(basicDeliveryParams(), templates);
      } catch (ex) {
        expect(String(ex)).toBe(
          "Error: Could not find any API key associated with the tenant"
        );
      }
    });

    it("will send inapp messages to /send", async () => {
      axiosMock.post.mockResolvedValue({ data: { success: true } });
      getTenantAuthTokensMock.mockImplementation(() =>
        Promise.resolve([
          {
            authToken: "mockAuthToken",
            scope: `published/production`,
          },
        ])
      );

      await sendHandler(
        {
          channel: {
            blockIds: [],
            id: "mockChannel",
            taxonomy: "push:web:courier",
            providers: [],
          },
          ...params,
        },
        templates
      );

      expect(axiosMock.post.mock.calls[0]).toEqual([
        "https://push.courier.com/send",
        {
          channel: "MOCK_CHANNEL",
          event: undefined,
          message: {
            data: {
              brandId: undefined,
              trackingIds: undefined,
              trackingUrl: undefined,
            },
            title: "mock title",
            body: "mock body",
          },
          messageId: undefined,
        },
        {
          headers: {
            "x-courier-client-key": "bW9ja1RlbmFudElk",
            "x-courier-user-id": "MOCK_CHANNEL",
            "x-courier-user-signature":
              "dbc2d4a3b5ef5e8619cd7dbc1df0cb55a42c1ce9b757c3c881f785eb7792392f",
          },
          timeout: 10000,
          timeoutErrorMessage: "Courier In-App API request timed out.",
        },
      ]);
    });

    it("will send inbox to /inbox", async () => {
      axiosMock.post.mockResolvedValue({ data: { success: true } });
      getTenantAuthTokensMock.mockImplementation(() =>
        Promise.resolve([
          {
            authToken: "mockAuthToken",
            scope: `published/production`,
          },
        ])
      );

      await sendHandler(
        {
          channel: {
            blockIds: [],
            id: "mockChannel",
            taxonomy: "inbox:courier",
            providers: [],
          },
          ...params,
        },
        templates
      );

      expect(axiosMock.post.mock.calls[0]).toEqual([
        "https://push.courier.com/inbox",
        {
          channel: "MOCK_CHANNEL",
          event: undefined,
          message: {
            data: {
              brandId: undefined,
              trackingIds: undefined,
              trackingUrl: undefined,
            },
            title: "mock title",
            body: "mock body",
          },
          messageId: undefined,
        },
        {
          headers: {
            "x-courier-client-key": "bW9ja1RlbmFudElk",
            "x-courier-user-id": "MOCK_CHANNEL",
            "x-courier-user-signature":
              "dbc2d4a3b5ef5e8619cd7dbc1df0cb55a42c1ce9b757c3c881f785eb7792392f",
          },
          timeout: 10000,
          timeoutErrorMessage: "Courier In-App API request timed out.",
        },
      ]);
    });

    it("channel data overrides will work", async () => {
      axiosMock.post.mockResolvedValue({ data: { success: true } });
      getTenantAuthTokensMock.mockImplementation(() =>
        Promise.resolve([
          {
            authToken: "mockAuthToken",
            scope: `published/production`,
          },
        ])
      );

      const channelOverride: ApiSendRequestOverrideChannel["channel"]["push"] =
        {
          data: {
            foo: "bar",
          },
          title: "title override",
          body: "body override",
        };

      await sendHandler(
        {
          channelOverride,
          channel: {
            blockIds: [],
            id: "mockChannel",
            taxonomy: "push:web:courier",
            providers: [],
          },
          ...params,
        },
        templates
      );

      expect(axiosMock.post.mock.calls[0]).toEqual([
        "https://push.courier.com/send",
        {
          channel: "MOCK_CHANNEL",
          event: undefined,
          message: {
            data: {
              ...channelOverride.data,
              brandId: undefined,
              trackingIds: undefined,
              trackingUrl: undefined,
            },
            title: channelOverride.title,
            body: channelOverride.body,
          },
          messageId: undefined,
        },
        {
          headers: {
            "x-courier-client-key": "bW9ja1RlbmFudElk",
            "x-courier-user-id": "MOCK_CHANNEL",
            "x-courier-user-signature":
              "dbc2d4a3b5ef5e8619cd7dbc1df0cb55a42c1ce9b757c3c881f785eb7792392f",
          },
          timeout: 10000,
          timeoutErrorMessage: "Courier In-App API request timed out.",
        },
      ]);
    });

    it("provider data overrides will work", async () => {
      axiosMock.post.mockResolvedValue({ data: { success: true } });
      getTenantAuthTokensMock.mockImplementation(() =>
        Promise.resolve([
          {
            authToken: "mockAuthToken",
            scope: `published/production`,
          },
        ])
      );

      const providerOverride = {
        data: {
          foo: "bar",
        },
        title: "title override",
        body: "body override",
      };

      await sendHandler(
        {
          override: providerOverride,
          channel: {
            blockIds: [],
            id: "mockChannel",
            taxonomy: "push:web:courier",
            providers: [],
          },
          ...params,
        },
        templates
      );

      expect(axiosMock.post.mock.calls[0]).toEqual([
        "https://push.courier.com/send",
        {
          channel: "MOCK_CHANNEL",
          event: undefined,
          message: {
            data: {
              ...providerOverride.data,
              brandId: undefined,
              trackingIds: undefined,
              trackingUrl: undefined,
            },
            title: providerOverride.title,
            body: providerOverride.body,
          },
          messageId: undefined,
        },
        {
          headers: {
            "x-courier-client-key": "bW9ja1RlbmFudElk",
            "x-courier-user-id": "MOCK_CHANNEL",
            "x-courier-user-signature":
              "dbc2d4a3b5ef5e8619cd7dbc1df0cb55a42c1ce9b757c3c881f785eb7792392f",
          },
          timeout: 10000,
          timeoutErrorMessage: "Courier In-App API request timed out.",
        },
      ]);
    });
  });

  describe("handles", () => {
    it("should return true when profile attribute is correctly passed", () => {
      expect(
        courierPush.handles({
          config: {} as any,
          profile: {
            courier: { channel: "MOCK_CHANNEL" },
          },
        })
      ).toEqual(true);
    });
    it("should return false when profile attribute is not passed", () => {
      expect(
        courierPush.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
    it("should return false when channel is passed in courier profile object but empty", () => {
      expect(
        courierPush.handles({
          config: {} as any,
          profile: {
            courier: { channel: "" },
          },
        })
      ).toEqual(false);
    });
  });
});
