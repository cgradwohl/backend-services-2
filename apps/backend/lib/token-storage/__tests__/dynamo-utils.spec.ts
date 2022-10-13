import { getHashFromRange } from "~/lib/get-hash-from-range";
import {
  dynamoItemToRecipientToken,
  dynamoItemFromWritableRecipientToken,
  getGsi1Pk,
  getGsi2Pk,
  getPk,
} from "../dynamo-utils";
import { WriteableRecipientToken, RecipientTokenDynamoItem } from "../types";

jest.mock("~/lib/get-hash-from-range");

const mockGetHashFromRange = getHashFromRange as jest.Mock;

describe("Token storage dynamo utils", () => {
  const globalDate = Date;
  const isoDate = "2022-01-01T00:00:00.000Z";
  const baseToken: WriteableRecipientToken = {
    tenantId: "tenant",
    recipientId: "recipient",
    token: "token",
    providerKey: "providerKey",
    status: "active",
    statusReason: "checked",
    expiryDate: "expiryDate",
    lastUsed: "lastUsed",
    properties: { test: "hello" },
    device: {
      appId: "appId",
      adId: "adId",
      deviceId: "deviceId",
      platform: "platform",
      manufacturer: "manufacturer",
      model: "model",
    },
    tracking: {
      osVersion: "osVersion",
      ip: "ip",
      lat: "lat",
      long: "long",
    },
  };

  beforeEach(() => {
    (global.Date as any) = jest.fn(() => ({
      toISOString: () => isoDate,
    }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    global.Date = globalDate;
  });

  describe("getPk", () => {
    it("should return properly formatted pk", () => {
      expect(getPk({ tenantId: "tenant", token: "token" })).toBe(
        "tenant/token"
      );
    });
  });

  describe("getGsi1Pk", () => {
    it("should return properly formatted gsi1 pk", () => {
      expect(getGsi1Pk({ tenantId: "tenant", recipientId: "recipient" })).toBe(
        "tenant/recipient"
      );
    });
  });

  describe("getGsi2Pk", () => {
    it("should return properly formatted gsi2 pk", () => {
      mockGetHashFromRange.mockReturnValue(10);
      expect(getGsi2Pk({ tenantId: "tenant" })).toBe("tenant/10");
    });
  });

  describe("dynamoItemToRecipientToken", () => {
    it("should correctly return a RecipientToken from a DynamoItem", () => {
      const item: RecipientTokenDynamoItem = {
        pk: "tenant/token",
        gsi1pk: "tenant/recipient",
        gsi2pk: "tenant/10",
        ...baseToken,
        created: isoDate,
        updated: isoDate,
      };

      expect(dynamoItemToRecipientToken(item)).toEqual({
        ...baseToken,
        created: isoDate,
        updated: isoDate,
      });
    });

    it("should return undefined if the item is undefined", () => {
      expect(dynamoItemToRecipientToken(undefined)).toBeUndefined();
    });
  });

  describe("dynamoItemFromWritableRecipientToken", () => {
    it("should correctly return a RecipientTokenDynamoItem from a NewRecipientToken", () => {
      mockGetHashFromRange.mockReturnValue(10);
      expect(dynamoItemFromWritableRecipientToken(baseToken)).toEqual({
        ...baseToken,
        pk: "tenant/token",
        gsi1pk: "tenant/recipient",
        gsi2pk: "tenant/10",
        created: isoDate,
        updated: isoDate,
      });
    });
  });
});
