import uuid from "uuid";
import * as categoryService from "~/lib/category-service";
import * as dynamoEvents from "~/lib/notification-service";
import { list } from "~/preferences/api/list";

import { API_GATEWAY_PROXY_EVENT } from "~/__tests__/lib/lambda-response.spec";

import { toApiKey } from "~/lib/api-key-uuid";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/notification-service");
jest.mock("~/lib/category-service");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamoEventsMock = dynamoEvents as any;
const dynamoCategoriesMock = categoryService as any;

describe("when getting profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return uncategorized and categories", async () => {
    const mockNotification1 = {
      id: uuid.v4(),
      json: {
        config: {
          type: "REQUIRED",
        },
      },
      title: "Mock Notification",
    };

    const mockCategory1 = {
      id: uuid.v4(),
      json: {
        notificationConfig: {
          type: "REQUIRED",
        },
      },
      title: "Mock Category",
    };

    dynamoCategoriesMock.list.mockResolvedValue({
      objects: [mockCategory1],
    });

    dynamoEventsMock.list.mockResolvedValue({
      objects: [mockNotification1],
    });

    await expect(
      list({ event: { ...API_GATEWAY_PROXY_EVENT } })
    ).resolves.toStrictEqual({
      categories: [
        {
          config: mockCategory1.json.notificationConfig,
          id: toApiKey(mockCategory1.id),
          notifications: [],
          title: mockCategory1.title,
        },
      ],
      uncategorized: [
        {
          config: mockNotification1.json.config,
          id: toApiKey(mockNotification1.id),
          title: mockNotification1.title,
        },
      ],
    });
  });

  it("will notification nested inside categories", async () => {
    const mockCategory1 = {
      id: uuid.v4(),
      json: {
        notificationConfig: {
          type: "REQUIRED",
        },
      },
      title: "Mock Category",
    };

    const mockNotification1 = {
      id: uuid.v4(),
      json: {
        categoryId: mockCategory1.id,
        config: {
          type: "REQUIRED",
        },
      },
      title: "Mock Notification",
    };

    dynamoCategoriesMock.list.mockResolvedValue({
      objects: [mockCategory1],
    });

    dynamoEventsMock.list.mockResolvedValue({
      objects: [mockNotification1],
    });

    await expect(
      list({ event: { ...API_GATEWAY_PROXY_EVENT } })
    ).resolves.toStrictEqual({
      categories: [
        {
          config: mockCategory1.json.notificationConfig,
          id: toApiKey(mockCategory1.id),
          notifications: [
            {
              config: mockNotification1.json.config,
              id: toApiKey(mockNotification1.id),
              title: mockNotification1.title,
            },
          ],
          title: mockCategory1.title,
        },
      ],
      uncategorized: [],
    });
  });

  it("will classify a notification as uncategorized if the category doesn't exist", async () => {
    const mockCategory1 = {
      id: uuid.v4(),
      json: {
        notificationConfig: {
          required: true,
        },
      },
      title: "Mock Category",
    };

    const mockNotification1 = {
      id: uuid.v4(),
      json: {
        categoryId: "backCategoryId",
        config: {
          required: true,
        },
      },
      title: "Mock Notification",
    };

    dynamoCategoriesMock.list.mockResolvedValue({
      objects: [mockCategory1],
    });

    dynamoEventsMock.list.mockResolvedValue({
      objects: [mockNotification1],
    });

    await expect(
      list({ event: { ...API_GATEWAY_PROXY_EVENT } })
    ).resolves.toStrictEqual({
      categories: [
        {
          config: mockCategory1.json.notificationConfig,
          id: toApiKey(mockCategory1.id),
          notifications: [],
          title: mockCategory1.title,
        },
      ],
      uncategorized: [
        {
          config: mockNotification1.json.config,
          id: toApiKey(mockNotification1.id),
          title: mockNotification1.title,
        },
      ],
    });
  });
});
