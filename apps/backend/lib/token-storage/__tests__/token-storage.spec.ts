import {
  put,
  getItem,
  update,
  query,
  deleteItem,
  batchWrite,
} from "~/lib/dynamo";
import getEnvVar from "~/lib/get-environment-variable";
import { getTtlFromNow } from "~/lib/get-ttl";
import {
  dynamoItemToRecipientToken,
  dynamoItemFromWritableRecipientToken,
  getGsi1Pk,
  getGsi2Pk,
  getPk,
} from "../dynamo-utils";
import {
  putToken,
  deleteToken,
  getToken,
  getTokensByRecipient,
  updateToken,
  putTokens,
  getTokensByProvider,
  evaluateTokenFreshness,
  updateTokenStatuses,
} from "../token-storage";
import {
  WriteableRecipientToken,
  RecipientTokenDynamoItem,
  RecipientToken,
} from "../types";

jest.mock("~/lib/dynamo");
jest.mock("../dynamo-utils");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/get-ttl");

const mockPut = put as jest.Mock;
const mockGetItem = getItem as jest.Mock;
const mockUpdate = update as jest.Mock;
const mockQuery = query as jest.Mock;
const mockDeleteItem = deleteItem as jest.Mock;
const mockBatchWrite = batchWrite as jest.Mock;

describe("Main token storage lib", () => {
  const globalDate = Date;

  beforeEach(() => {
    (global.Date as any) = jest.fn(() => ({
      toISOString: () => "2022-01-01T00:00:00.000Z",
    }));
  });

  afterEach(jest.clearAllMocks);

  afterAll(() => {
    global.Date = globalDate;
  });

  const recipientId = "recipient";
  const token = "token";
  const tenantId = "tenant";
  const baseToken: WriteableRecipientToken = {
    tenantId,
    recipientId,
    token,
    providerKey: "providerKey",
    status: "active",
    statusReason: "checked",
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

  const dynamoItem: RecipientTokenDynamoItem = {
    pk: getPk({ tenantId, token }),
    gsi1pk: getGsi1Pk({ tenantId, recipientId }),
    gsi2pk: getGsi2Pk({ tenantId }),
    ...baseToken,
    created: "2022-01-01T00:00:00.000Z",
    updated: "2022-01-01T00:00:00.000Z",
  };

  describe("putToken", () => {
    it("should add a token to dynamo", async () => {
      await putToken(baseToken);

      expect(mockPut).toHaveBeenCalledWith({
        Item: dynamoItem,
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
      });
    });
  });

  describe("putTokens", () => {
    it("should add multiple token to dynamo", async () => {
      mockQuery.mockResolvedValue({ Items: [dynamoItem] });
      const tokens: WriteableRecipientToken[] = [
        { ...baseToken, token: "token2" },
        { ...baseToken, token: "token3" },
      ];

      await putTokens({ tokens, tenantId, recipientId });

      expect(mockBatchWrite).toHaveBeenCalledWith({
        RequestItems: {
          [getEnvVar("TOKEN_STORAGE_TABLE")]: [
            ...tokens.map((token) => ({
              PutRequest: {
                Item: dynamoItemFromWritableRecipientToken(token),
              },
            })),
            {
              DeleteRequest: {
                Key: {
                  pk: getPk({ tenantId, token }),
                },
              },
            },
          ],
        },
      });
    });
  });

  describe("getToken", () => {
    it("should get a token from dynamo", async () => {
      mockGetItem.mockResolvedValueOnce({ Item: dynamoItem });

      const result = await getToken({
        tenantId,
        token,
      });

      expect(mockGetItem).toHaveBeenCalledWith({
        Key: {
          pk: getPk({ tenantId, token }),
        },
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
      });

      expect(result).toEqual(dynamoItemToRecipientToken(dynamoItem));
    });

    it("should return undefined if no token is found", async () => {
      mockGetItem.mockResolvedValueOnce({
        Item: undefined,
      });

      const result = await getToken({
        tenantId,
        token,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("getTokensByRecipient", () => {
    it("should get tokens by recipient", async () => {
      mockQuery.mockResolvedValueOnce({
        Items: [dynamoItem],
      });

      const result = await getTokensByRecipient({
        tenantId,
        recipientId,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        IndexName: "gsi1",
        KeyConditionExpression: "#gsi1pk = :gsi1pk",
        ExpressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
        },
        ExpressionAttributeValues: {
          ":gsi1pk": getGsi1Pk({ tenantId, recipientId }),
        },
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
      });

      expect(result).toEqual([dynamoItemToRecipientToken(dynamoItem)]);
    });
  });

  describe("updateToken", () => {
    it("should update specified fields", async () => {
      await updateToken({
        tenantId,
        token,
        status: baseToken.status,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        ConditionExpression: "attribute_exists(pk)",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updated": "updated",
        },
        ExpressionAttributeValues: {
          ":status": baseToken.status,
          ":updated": new Date().toISOString(),
        },
        Key: { pk: getPk({ tenantId, token }) },
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
        UpdateExpression: "SET #status = :status, #updated = :updated",
      });
    });

    it("should set ttl if update includes status of failed", async () => {
      await updateToken({
        tenantId,
        token,
        status: "failed",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        ConditionExpression: "attribute_exists(pk)",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updated": "updated",
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":status": "failed",
          ":updated": new Date().toISOString(),
          ":ttl": getTtlFromNow({}),
        },
        Key: { pk: getPk({ tenantId, token }) },
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
        UpdateExpression:
          "SET #status = :status, #ttl = :ttl, #updated = :updated",
      });
    });
  });

  describe("deleteToken", () => {
    it("should delete a token from dynamo", async () => {
      await deleteToken({
        tenantId,
        token,
      });

      expect(mockDeleteItem).toHaveBeenCalledWith({
        Key: { pk: getPk({ tenantId, token }) },
        TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
      });
    });
  });

  describe("getTokensByProvider", () => {
    it("should map tokens", async () => {
      const Items = [
        { ...dynamoItem, providerKey: "apn", token: "a" },
        { ...dynamoItem, providerKey: "apn", token: "b" },
        { ...dynamoItem, providerKey: "firebase", token: "c" },
      ];

      const tokens = Items.map(dynamoItemToRecipientToken);

      mockQuery.mockResolvedValueOnce({ Items });

      const result = await getTokensByProvider({ tenantId, recipientId });
      expect(result).toEqual({
        apn: [tokens[0], tokens[1]],
        firebase: [tokens[2]],
      });
    });
  });

  describe("evaluateTokenFreshness", () => {
    it("Should mark stale tokens and return values of fresh ones", async () => {
      global.Date = globalDate;
      const tokens: RecipientToken[] = [
        {
          ...baseToken,
          token: "good1",
          created: new globalDate().toISOString(),
          updated: new globalDate().toISOString(),
        },
        {
          ...baseToken,
          token: "good2",
          created: new globalDate().toISOString(),
          updated: new globalDate().toISOString(),
        },
        {
          ...baseToken,
          token: "good3",
          created: new globalDate().toISOString(),
          updated: new globalDate().toISOString(),
          expiryDate: new globalDate(Date.now() + 50000).toISOString(),
        },
        {
          ...baseToken,
          token: "good4",
          created: "2020-01-01T00:00:00.000Z",
          updated: new globalDate().toISOString(),
          expiryDate: false,
        },
        {
          ...baseToken,
          token: "stale1",
          created: "2020-01-01T00:00:00.000Z",
          updated: "2020-01-01T00:00:00.000Z",
        },
        {
          ...baseToken,
          token: "stale2",
          created: "2020-01-01T00:00:00.000Z",
          updated: "2020-01-01T00:00:00.000Z",
        },
        {
          ...baseToken,
          token: "stale3",
          created: new globalDate().toISOString(),
          updated: new globalDate().toISOString(),
          expiryDate: new globalDate(Date.now() - 50000).toISOString(),
        },
      ];

      const TOKEN_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 60; // 60 days
      const result = await evaluateTokenFreshness(tokens, TOKEN_EXPIRATION_MS);
      expect(mockUpdate).toHaveBeenCalledTimes(3);
      expect(result).toEqual([
        tokens[0].token,
        tokens[1].token,
        tokens[2].token,
        tokens[3].token,
      ]);
    });
  });

  describe("updateTokenStatuses", () => {
    it("Should update tokens", async () => {
      await updateTokenStatuses({
        tenantId,
        results: [
          { token: "a", status: "active", reason: "d" },
          { token: "b", status: "active", reason: "d" },
          { token: "c", status: "failed", reason: "d" },
        ],
      });

      // TODO: Improve this test once we split up token-storage.ts for easier testing;
      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe("getTokensByProvider", () => {
    it("should map tokens", async () => {
      const Items = [
        { ...dynamoItem, providerKey: "apn", token: "a" },
        { ...dynamoItem, providerKey: "apn", token: "b" },
        { ...dynamoItem, providerKey: "firebase", token: "c" },
      ];

      const tokens = Items.map(dynamoItemToRecipientToken);

      mockQuery.mockResolvedValueOnce({ Items });

      const result = await getTokensByProvider({ tenantId, recipientId });
      expect(result).toEqual({
        apn: [tokens[0], tokens[1]],
        firebase: [tokens[2]],
      });
    });
  });
});
