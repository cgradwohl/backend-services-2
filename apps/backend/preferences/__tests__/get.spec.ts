import uuid from "uuid";
import { toApiKey } from "~/lib/api-key-uuid";
import * as dynamoProfiles from "~/lib/dynamo/profiles";
import { get } from "~/preferences/api/get";

import { API_GATEWAY_PROXY_EVENT } from "~/__tests__/lib/lambda-response.spec";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

const mockCategoryId = uuid.v4();
const mockNotificationId = uuid.v4();

describe("when getting profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return empty profile given no profile", async () => {
    dynamo.get.mockResolvedValue(null);

    await expect(
      get({ event: { ...API_GATEWAY_PROXY_EVENT } })
    ).resolves.toStrictEqual({
      categories: {},
      notifications: {},
    });
  });

  it("will return preferences", async () => {
    const preferences = {
      categories: {
        [mockCategoryId]: "mockCategory",
      },
      notifications: {
        [mockNotificationId]: "mockNotification",
      },
    };
    dynamo.get.mockResolvedValue({ preferences });

    await expect(
      get({ event: { ...API_GATEWAY_PROXY_EVENT } })
    ).resolves.toStrictEqual({
      categories: {
        [toApiKey(mockCategoryId)]: "mockCategory",
      },
      notifications: {
        [toApiKey(mockNotificationId)]: "mockNotification",
      },
    });
  });
});
