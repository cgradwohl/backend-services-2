import { RecipientToken, WriteableRecipientToken } from "~/lib/token-storage";
import { IUsersPutTokenData, IUsersTokenData } from "~/types.public";
import {
  recipientTokenToUsersTokenBody,
  usersTokenBodyToWritableRecipientToken,
} from "../mappers";

describe("users handlers lib mappers", () => {
  const baseBody: IUsersTokenData = {
    token: "token",
    properties: {},
    provider_key: "provider",
    status: "unknown",
    status_reason: "status_reason",
    expiry_date: "expiry_date",
    device: {
      app_id: "app",
      ad_id: "ad",
      device_id: "device",
      platform: "platform",
      manufacturer: "manufacturer",
      model: "model",
    },
    tracking: {
      ip: "ip",
      lat: "lat",
      long: "long",
      os_version: "os_version",
    },
  };

  const baseWritableRecipientToken: WriteableRecipientToken = {
    tenantId: "tenant",
    recipientId: "recipient",
    token: "token",
    properties: {},
    providerKey: "provider",
    status: "unknown",
    statusReason: "status_reason",
    expiryDate: "expiry_date",
    device: {
      appId: "app",
      adId: "ad",
      deviceId: "device",
      platform: "platform",
      manufacturer: "manufacturer",
      model: "model",
    },
    tracking: {
      ip: "ip",
      lat: "lat",
      long: "long",
      osVersion: "os_version",
    },
  };

  describe("usersTokenBodyToWritableRecipientToken", () => {
    it("should convert a put token body to a put recipient token", () => {
      const body: IUsersPutTokenData & {
        tenantId: string;
        recipientId: string;
        token: string;
      } = {
        ...baseBody,
        tenantId: "tenant",
        recipientId: "recipient",
        token: "token",
      };

      expect(usersTokenBodyToWritableRecipientToken(body)).toEqual(
        baseWritableRecipientToken
      );
    });
  });

  describe("recipientTokenToUsersTokenBody", () => {
    it("should convert a recipient token to a users token body", () => {
      const token: RecipientToken = {
        tenantId: "tenant",
        recipientId: "recipient",
        ...baseWritableRecipientToken,
        created: "",
        updated: "",
      };

      expect(recipientTokenToUsersTokenBody(token)).toEqual(baseBody);
    });
  });
});
