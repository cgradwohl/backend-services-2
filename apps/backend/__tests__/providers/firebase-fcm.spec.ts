import axios from "axios";
import googleapis from "googleapis";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import firebase from "~/providers/firebase-fcm";
import sendHandler from "~/providers/firebase-fcm/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

jest.mock("googleapis", () => {
  const getAccessToken = jest.fn();

  const GoogleAuth = jest.fn(() => ({
    getClient: () => ({
      getAccessToken,
    }),
  }));

  return {
    google: { auth: { GoogleAuth } },
  };
});

const basicDeliveryParams = (
  config?: any,
  body: any = { profile: {} },
  override?: any
): DeliveryHandlerParams => {
  const variableData = {
    event: "",
    recipient: "",
    ...body,
  };
  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    channelTrackingUrl: "https://api.courier.com/e/123_channelTrackingId",
    config: {
      ...config,
      provider: "",
    },
    linkHandler,
    override,
    profile: body.profile,
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

describe("Firebase FCM provider", () => {
  describe("send", () => {
    it("should require a device token", async () => {
      const params = basicDeliveryParams();
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No device token specified."
      );
    });

    it("should require an api key", async () => {
      const params = basicDeliveryParams(null, {
        profile: { firebaseToken: "token" },
      });
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Service Account JSON specified."
      );
    });

    it("should require valid Service Account JSON project_id", async () => {
      const params = basicDeliveryParams(
        {
          serviceAccountJSON: JSON.stringify({}),
        },
        {
          profile: { firebaseToken: "token" },
        }
      );
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "project_id required in Service Account JSON"
      );
    });

    it("should require valid Service Account JSON", async () => {
      const params = basicDeliveryParams(
        {
          serviceAccountJSON: JSON.stringify({ project_id: "mock-project-id" }),
        },
        {
          profile: { firebaseToken: "token" },
        }
      );
      const templates = { body: "", title: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Invalid Service Account JSON"
      );
    });

    it("should send message request to firebase", async () => {
      (axios as any as jest.Mock).mockResolvedValue({
        data: { name: "test-message-id" },
      });
      (new googleapis.google.auth.GoogleAuth() as any)
        .getClient()
        .getAccessToken.mockReturnValueOnce({ token: "mock-google-jwt-token" });

      const params = basicDeliveryParams(
        {
          serviceAccountJSON: JSON.stringify({
            client_email: "mock@email.com",
            private_key: "mock-private-key-value",
            project_id: "mock-project-id",
          }),
        },
        {
          profile: {
            firebaseToken: "mock-token-value",
          },
        }
      );

      const templates = {
        body: "",
        title: undefined,
        clickAction: "myclickaction.com",
      };
      await expect(sendHandler(params, templates)).resolves.toEqual({
        name: "test-message-id",
      });

      expect((axios as any as jest.Mock).mock.calls.length).toBe(1);
      expect((axios as any as jest.Mock).mock.calls[0]).toEqual([
        {
          data: {
            message: {
              data: {
                clickAction: templates.clickAction,
                trackingUrl: "https://api.courier.com/e/123_channelTrackingId",
              },
              notification: {
                body: "",
                title: undefined,
              },
              token: "mock-token-value",
            },
          },
          headers: {
            Authorization: "Bearer mock-google-jwt-token",
            "Content-Type": "application/json",
          },
          method: "post",
          timeout: 10000,
          timeoutErrorMessage: "Firebase FCM API request timed out.",
          url: "https://fcm.googleapis.com/v1/projects/mock-project-id/messages:send",
        },
      ]);
    });

    it("should send message request with overrides to firebase", async () => {
      (axios as any as jest.Mock).mockResolvedValue({
        data: { name: "test-message-id" },
      });
      (new googleapis.google.auth.GoogleAuth() as any)
        .getClient()
        .getAccessToken.mockReturnValueOnce({ token: "mock-google-jwt-token" });

      const params = basicDeliveryParams(
        {
          serviceAccountJSON: JSON.stringify({
            client_email: "mock@email.com",
            private_key: "mock-private-key-value",
            project_id: "mock-project-id",
          }),
        },
        {
          profile: {
            firebaseToken: "mock-token-value",
          },
        },
        {
          body: {
            data: {
              test: "123",
            },
          },
          config: {
            serviceAccountJSON: {
              client_email: "override_mock@email.com",
              private_key: "override-mock-private-key-value",
              project_id: "override-mock-project-id",
            },
          },
        }
      );

      const templates = { body: "", title: undefined };
      await expect(sendHandler(params, templates)).resolves.toEqual({
        name: "test-message-id",
      });

      expect((axios as any as jest.Mock).mock.calls.length).toBe(2);
      expect((axios as any as jest.Mock).mock.calls[1]).toEqual([
        {
          data: {
            message: {
              data: {
                test: "123",
                trackingUrl: "https://api.courier.com/e/123_channelTrackingId",
              },
              notification: {
                body: "",
              },
              token: "mock-token-value",
            },
          },
          headers: {
            Authorization: "Bearer mock-google-jwt-token",
            "Content-Type": "application/json",
          },
          method: "post",
          timeout: 10000,
          timeoutErrorMessage: "Firebase FCM API request timed out.",
          url: "https://fcm.googleapis.com/v1/projects/override-mock-project-id/messages:send",
        },
      ]);
    });

    it("should send message request with a title to firebase", async () => {
      (axios as any as jest.Mock).mockResolvedValue({
        data: { name: "test-message-id" },
      });
      (new googleapis.google.auth.GoogleAuth() as any)
        .getClient()
        .getAccessToken.mockReturnValueOnce({ token: "mock-google-jwt-token" });

      const params = basicDeliveryParams(
        {
          serviceAccountJSON: JSON.stringify({
            client_email: "mock@email.com",
            private_key: "mock-private-key-value",
            project_id: "mock-project-id",
          }),
        },
        {
          profile: {
            firebaseToken: "mock-token-value",
          },
        }
      );

      params.firebaseFcmConfig = {
        title: "My Test Title",
      };

      const templates = { body: "", title: params.firebaseFcmConfig.title };
      await expect(sendHandler(params, templates)).resolves.toEqual({
        name: "test-message-id",
      });

      expect((axios as any as jest.Mock).mock.calls.length).toBe(3);
      expect((axios as any as jest.Mock).mock.calls[2]).toEqual([
        {
          data: {
            message: {
              data: {
                trackingUrl: "https://api.courier.com/e/123_channelTrackingId",
              },
              notification: {
                body: "",
                title: "My Test Title",
              },
              token: "mock-token-value",
            },
          },
          headers: {
            Authorization: "Bearer mock-google-jwt-token",
            "Content-Type": "application/json",
          },
          method: "post",
          timeout: 10000,
          timeoutErrorMessage: "Firebase FCM API request timed out.",
          url: "https://fcm.googleapis.com/v1/projects/mock-project-id/messages:send",
        },
      ]);
    });
  });

  describe("handles", () => {
    it("should return true when provided a firebaseToken", () => {
      expect(
        firebase.handles({
          config: {} as any,
          profile: { firebaseToken: "any string" },
        })
      ).toEqual(true);
    });

    it("should return false when firebaseToken is not set", () => {
      expect(
        firebase.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });

    it("should check for stored tokens", () => {
      expect(
        firebase.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {
            "firebase-fcm": [{ token: "123456" } as any],
          },
        })
      ).toEqual(true);
      expect(
        firebase.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: {},
        })
      ).toEqual(false);
    });
  });
});
