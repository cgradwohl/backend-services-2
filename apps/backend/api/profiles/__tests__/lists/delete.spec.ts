import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";
import { deleteProfileLists } from "~/api/profiles/lists/delete";
import * as dynamoProfiles from "~/lib/dynamo/profiles";
import * as subscriptionStore from "~/lib/lists";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/lists");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

describe("when deleting all list subscriptions associated with profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should delete all active subscriptions for a given profileId", async () => {
    const unsubscribeSpy = jest.spyOn(subscriptionStore, "unsubscribe");
    dynamo.getListsForProfile.mockResolvedValue({
      items: [
        {
          created: "2020-06-10T18:41:29.093Z",
          id: "example.list.id",
          name: "Example List Name",
          updated: "2020-06-10T18:41:29.093Z",
        },
        {
          created: "2020-06-10T18:41:29.093Z",
          id: "example.list.id2",
          name: "Example List Name 2",
          updated: "2020-06-10T18:41:29.093Z",
        },
      ],
      lastEvaluatedKey: null,
    });
    await expect(deleteProfileLists(apiRequestContext)).resolves.toStrictEqual({
      status: "SUCCESS",
    });

    expect(unsubscribeSpy.mock.calls.length).toBe(2);
    const [
      firstUnsubscribeCall,
      secondUnsubscribeCall,
    ] = unsubscribeSpy.mock.calls;

    expect(firstUnsubscribeCall).toEqual([
      "a-tenantId",
      "example.list.id",
      "id",
    ]);

    expect(secondUnsubscribeCall).toEqual([
      "a-tenantId",
      "example.list.id2",
      "id",
    ]);
  });
});
