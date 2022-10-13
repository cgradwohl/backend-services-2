import { getProfileLists } from "~/api/profiles/lists/get";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

describe("when getting list subscriptions associated with profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty result given profile has no active subscriptions", async () => {
    dynamo.getListsForProfile.mockResolvedValue({
      items: [],
      lastEvaluatedKey: null,
    });
    await expect(getProfileLists(apiRequestContext)).resolves.toStrictEqual({
      paging: {
        cursor: null,
        more: false,
      },
      results: [],
    });
  });

  it("should return lists of subscriptions given profile has some active subscriptions", async () => {
    dynamo.getListsForProfile.mockResolvedValue({
      items: [
        {
          created: "2020-06-10T18:41:29.093Z",
          id: "example.list.id",
          name: "Example List Name",
          preferences: {
            notifications: {
              W951R8G37V49KZMK8DEKW8Z588BZ: {
                stataus: "OPTED_IN",
              },
            },
          },
          updated: "2020-06-10T18:41:29.093Z",
        },
      ],
      lastEvaluatedKey: null,
    });
    await expect(getProfileLists(apiRequestContext)).resolves.toStrictEqual({
      paging: {
        cursor: null,
        more: false,
      },
      results: [
        {
          created: "2020-06-10T18:41:29.093Z",
          id: "example.list.id",
          name: "Example List Name",
          preferences: {
            notifications: {
              W951R8G37V49KZMK8DEKW8Z588BZ: {
                stataus: "OPTED_IN",
              },
            },
          },
          updated: "2020-06-10T18:41:29.093Z",
        },
      ],
    });
  });
});
