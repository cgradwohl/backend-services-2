import uuid from "uuid";

import * as dynamoProfiles from "~/lib/dynamo/profiles";
import { put } from "~/preferences/api/put";

import { API_GATEWAY_PROXY_EVENT } from "~/__tests__/lib/lambda-response.spec";
import { toApiKey } from "~/lib/api-key-uuid";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;
const mockCategoryId = uuid.v4();
const mockNotificationId = uuid.v4();

describe("when adding preferences", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return a new profile given an existing profile", async () => {
    dynamo.get.mockResolvedValue({
      categories: {},
      notifications: {},
    });

    const newPreferences = {
      categories: {
        [toApiKey(mockCategoryId)]: {
          status: "OPTED_OUT",
        },
      },
      notifications: {
        [toApiKey(mockNotificationId)]: {
          status: "OPTED_IN",
        },
      },
    };

    await expect(
      put({
        event: {
          ...API_GATEWAY_PROXY_EVENT,
          body: newPreferences,
        },
      })
    ).resolves.toEqual({ status: "SUCCESS" });

    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
      preferences: {
        categories: {
          [mockCategoryId]: {
            status: "OPTED_OUT",
          },
        },
        notifications: {
          [mockNotificationId]: {
            status: "OPTED_IN",
          },
        },
      },
    });
  });
});
