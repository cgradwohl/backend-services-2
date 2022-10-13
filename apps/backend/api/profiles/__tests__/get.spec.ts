import { get } from "~/api/profiles/get";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

describe("when getting profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return empty profile given no profile", async () => {
    dynamo.get.mockResolvedValue(null);

    await expect(get(apiRequestContext)).resolves.toStrictEqual({
      preferences: {},
      profile: {},
    });
  });

  it("will return json given dynamo has a string value", async () => {
    dynamo.get.mockResolvedValue({ json: '{ "answer": 42 }' });

    await expect(get(apiRequestContext)).resolves.toStrictEqual({
      preferences: {},
      profile: { answer: 42 },
    });
  });

  it("will return json given dynamo has a json value", async () => {
    dynamo.get.mockResolvedValue({ json: { answer: 42 } });

    await expect(get(apiRequestContext)).resolves.toStrictEqual({
      preferences: {},
      profile: { answer: 42 },
    });
  });

  it("will return profile along with preferences", async () => {
    dynamo.get.mockResolvedValue({
      json: { answer: 42 },
      preferences: {
        categories: {
          category_id: {
            status: "OPTED_OUT",
          },
        },
        notifications: {
          notification_id: {
            status: "OPTED_OUT",
          },
        },
      },
    });

    await expect(get(apiRequestContext)).resolves.toStrictEqual({
      preferences: {
        categories: {
          category_id: {
            status: "OPTED_OUT",
          },
        },
        notifications: {
          notification_id: {
            status: "OPTED_OUT",
          },
        },
      },
      profile: { answer: 42 },
    });
  });
});
