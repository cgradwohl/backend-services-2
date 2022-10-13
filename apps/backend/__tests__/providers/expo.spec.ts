import ExpoModule from "expo-server-sdk";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { ProviderResponseError } from "~/providers/errors";
import expo from "~/providers/expo";
import sendHandler from "~/providers/expo/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("expo-server-sdk", () => {
  const sendPushNotificationsAsync = jest.fn();

  return class ExpoMock {
    public static isExpoPushToken = jest.fn();
    public static sendPushNotificationsAsync = sendPushNotificationsAsync;
    public sendPushNotificationsAsync = sendPushNotificationsAsync;
  };
});

const Expo = ExpoModule as any;

const getDeliveryHandlerParams = (
  expoProfile: any = { tokens: ["ExpoPushToken[1234567890]"] },
  config: any = {},
  override?: any,
  data?: any
): DeliveryHandlerParams => {
  const variableData = {
    data: { isBodyData: true, ...data },
    event: "",
    profile: { expo: expoProfile },
    recipient: "",
  };
  const variableHandler = createVariableHandler({
    value: variableData,
  }).getScoped("data");
  const linkHandler = createLinkHandler({});

  return {
    channelTrackingUrl: "https://api.courier.com/e/123_channelTrackingId",
    config: {
      provider: "",
    },
    expoConfig: config,
    linkHandler,
    override,
    profile: variableData.profile,
    trackingIds: {
      channelTrackingId: "channelTrackingId",
      clickTrackingId: "clickTrackingId",
      deliverTrackingId: "deliveryTrackingId",
      readTrackingId: "readTrackingId",
    },

    variableData,
    variableHandler,
  };
};

describe("expo provider", () => {
  describe("handles", () => {
    it("should return true when provided an expoPushToken", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: { expo: { tokens: ["ExpoPushToken[1234567890]"] } },
        })
      ).toEqual(true);
    });

    it("should allow a single token string", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: { expo: { tokens: "ExpoPushToken[1234567890]" } },
        })
      ).toEqual(true);
    });

    it("should allow a single token string on token property", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: { expo: { token: "ExpoPushToken[1234567890]" } },
        })
      ).toEqual(true);
    });

    [{}, 1234567890, ["ExpoPushToken[2345678901"]].forEach((testCase) => {
      it(`should throw an error if a single token is ${testCase}`, () => {
        expect(() =>
          expo.handles({
            config: {} as any,
            profile: { expo: { token: testCase } },
          })
        ).toThrow(ProviderResponseError);
      });
    });

    it("should allow both token and tokens", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: {
            expo: {
              token: "ExpoPushToken[2345678901]",
              tokens: "ExpoPushToken[1234567890]",
            },
          },
        })
      ).toEqual(true);
    });

    it("should check for stored tokens", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {
            expo: [{ token: "ExpoPushToken[2345678901]" } as any],
          },
        })
      ).toEqual(true);
      expect(
        expo.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {},
        })
      ).toEqual(false);
    });

    it("should require an expoPushToken", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: {},
        })
      ).toBe(false);
    });

    it("should require an expoPushTokens with at least one token", () => {
      expect(
        expo.handles({
          config: {} as any,
          profile: { expo: { tokens: [] } },
        })
      ).toBe(false);
    });

    it("should throw an error if an expoPushTokens has a non string element", () => {
      expect(() =>
        expo.handles({
          config: {} as any,
          profile: { expo: { tokens: [1234567890] } },
        })
      ).toThrow(ProviderResponseError);
    });

    it("should throw an error if expo is not an object", () => {
      expect(() =>
        expo.handles({
          config: {} as any,
          profile: { expo: "ExpoPushToken[1234567890]" },
        })
      ).toThrow(ProviderResponseError);
    });

    it("should throw an error if expo.tokens is not an array", () => {
      expect(() =>
        expo.handles({
          config: {} as any,
          profile: { expo: { tokens: {} } },
        })
      ).toThrow(ProviderResponseError);
    });
  });

  describe("send", () => {
    afterEach(jest.clearAllMocks);

    it("should handle token in profile", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);

      const params = getDeliveryHandlerParams({
        token: "ExpoPushToken[2345678901]",
      });
      const templates = { body: "", subtitle: "", title: "" };

      await sendHandler(params, templates);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[2345678901]",
      ]);
    });

    it("should handle deduping token and tokens the string in profile", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);

      const params = getDeliveryHandlerParams({
        token: "ExpoPushToken[1234567890]",
        tokens: "ExpoPushToken[1234567890]",
      });
      const templates = { body: "", subtitle: "", title: "" };

      await sendHandler(params, templates);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
    });

    it("should handle deduping token and tokens array in profile", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);

      const params = getDeliveryHandlerParams({
        token: "ExpoPushToken[1234567890]",
        tokens: ["ExpoPushToken[1234567890]", "ExpoPushToken[1234567890]"],
      });
      const templates = { body: "", subtitle: "", title: "" };

      await sendHandler(params, templates);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
    });

    it("should handle token and tokens the string in profile", async () => {
      const tickets = [
        { status: "ok", id: "123" },
        { status: "ok", id: "456" },
      ];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);

      const params = getDeliveryHandlerParams({
        token: "ExpoPushToken[2345678901]",
        tokens: "ExpoPushToken[1234567890]",
      });
      const templates = { body: "", subtitle: undefined, title: undefined };

      await sendHandler(params, templates);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(2);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.isExpoPushToken.mock.calls[1]).toEqual([
        "ExpoPushToken[2345678901]",
      ]);

      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[1234567890]",
            },
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[2345678901]",
            },
          ],
        ]
      `);
    });

    it("should handle token and tokens array in profile", async () => {
      const tickets = [
        { status: "ok", id: "123" },
        { status: "ok", id: "456" },
        { status: "ok", id: "789" },
      ];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);

      const params = getDeliveryHandlerParams({
        token: "ExpoPushToken[2345678901]",
        tokens: ["ExpoPushToken[1234567890]", "ExpoPushToken[3456789012]"],
      });
      const templates = { body: "", subtitle: undefined, title: undefined };

      await sendHandler(params, templates);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(3);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.isExpoPushToken.mock.calls[1]).toEqual([
        "ExpoPushToken[3456789012]",
      ]);
      expect(Expo.isExpoPushToken.mock.calls[2]).toEqual([
        "ExpoPushToken[2345678901]",
      ]);

      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[1234567890]",
            },
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[3456789012]",
            },
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[2345678901]",
            },
          ],
        ]
      `);
    });

    it("should send a push notification", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams();
      const templates = { body: "", subtitle: undefined, title: undefined };
      await expect(sendHandler(params, templates)).resolves.toEqual(tickets);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.sendPushNotificationsAsync.mock.calls.length).toEqual(1);
      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[1234567890]",
            },
          ],
        ]
      `);
    });

    it("should handle variables in title and subtitle", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams(
        undefined,
        {
          subtitle: "{subtitle}",
          title: "Hello {name}",
        },
        undefined,
        { name: "World", subtitle: "my subtitle" }
      );
      const templates = {
        body: "",
        subtitle: "my subtitle",
        title: "Hello World",
      };
      await expect(sendHandler(params, templates)).resolves.toEqual(tickets);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.sendPushNotificationsAsync.mock.calls.length).toEqual(1);
      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "name": "World",
                "subtitle": "my subtitle",
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": "my subtitle",
              "title": "Hello World",
              "to": "ExpoPushToken[1234567890]",
            },
          ],
        ]
      `);
    });

    it("should send a push notification when passed a single string", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams({
        tokens: "ExpoPushToken[1234567890]",
      });
      const templates = { body: "", subtitle: undefined, title: undefined };
      await expect(sendHandler(params, templates)).resolves.toEqual(tickets);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.sendPushNotificationsAsync.mock.calls.length).toEqual(1);
      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[1234567890]",
            },
          ],
        ]
      `);
    });

    it("should send multiple push notifications", async () => {
      const tickets = [
        { status: "ok", id: "123" },
        { status: "ok", id: "456" },
      ];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams({
        tokens: ["ExpoPushToken[1234567890]", "ExpoPushToken[0987654321]"],
      });
      const templates = { body: "", subtitle: undefined, title: undefined };
      await expect(sendHandler(params, templates)).resolves.toEqual(tickets);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(2);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.isExpoPushToken.mock.calls[1]).toEqual([
        "ExpoPushToken[0987654321]",
      ]);
      expect(Expo.sendPushNotificationsAsync.mock.calls.length).toEqual(1);
      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[1234567890]",
            },
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "subtitle": undefined,
              "title": undefined,
              "to": "ExpoPushToken[0987654321]",
            },
          ],
        ]
      `);
    });

    it("should verify the expo token", async () => {
      Expo.isExpoPushToken.mockReturnValue(false);
      const params = getDeliveryHandlerParams();
      const templates = { body: "", subtitle: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toBeInstanceOf(
        ProviderResponseError
      );

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
    });

    it("should send a push notification with overrides", async () => {
      const tickets = [{ status: "ok", id: "123" }];
      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams(
        undefined,
        { subtitle: "my subtitle", title: "my title" },
        { sound: null }
      );
      const templates = {
        body: "",
        subtitle: params.expoConfig.subtitle,
        title: params.expoConfig.title,
      };
      await expect(sendHandler(params, templates)).resolves.toEqual(tickets);

      expect(Expo.isExpoPushToken.mock.calls.length).toEqual(1);
      expect(Expo.isExpoPushToken.mock.calls[0]).toEqual([
        "ExpoPushToken[1234567890]",
      ]);
      expect(Expo.sendPushNotificationsAsync.mock.calls.length).toEqual(1);
      expect(Expo.sendPushNotificationsAsync.mock.calls[0])
        .toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "body": "",
              "data": Object {
                "clickAction": undefined,
                "isBodyData": true,
                "trackingUrl": "https://api.courier.com/e/123_channelTrackingId",
              },
              "sound": null,
              "subtitle": "my subtitle",
              "title": "my title",
              "to": "ExpoPushToken[1234567890]",
            },
          ],
        ]
      `);
    });

    it("should error when single ticket fails to send notification", async () => {
      const tickets = [{ status: "error", id: "123" }];

      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams({
        tokens: ["ExpoPushToken[1234567890]"],
      });
      const templates = { body: "", subtitle: "", title: "" };
      try {
        await sendHandler(params, templates);
      } catch (e) {
        expect(e).toBeInstanceOf(ProviderResponseError);
        expect(e.payload).toEqual(tickets);
      }
    });

    it("should error when multiple tickets fail to send notification", async () => {
      const tickets = [
        { status: "error", id: "123" },
        { status: "error", id: "456" },
      ];

      Expo.isExpoPushToken.mockReturnValue(true);
      Expo.sendPushNotificationsAsync.mockResolvedValue(tickets);
      const params = getDeliveryHandlerParams({
        tokens: ["ExpoPushToken[1234567890]", "ExpoPushToken[0987654321]"],
      });
      const templates = { body: "", subtitle: "", title: "" };
      try {
        await sendHandler(params, templates);
      } catch (e) {
        expect(e).toBeInstanceOf(ProviderResponseError);
        expect(e.payload).toEqual(tickets);
      }
    });
  });
});
